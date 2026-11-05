#!/usr/bin/env python3
"""Backend smoke test for a deployed ConnectNest stack.

Invokes the deployed Lambda handlers directly (via the AWS CLI) with a synthetic
authenticated event and checks the response codes for the main features:
events and RSVP, posts, likes, comments, groups, profiles, content moderation,
and upload URLs.

Requirements: Python 3, AWS CLI configured for the account/region where the
stack is deployed.

WARNING: this writes real test records (one event, post, group, etc.) to the
deployed tables under the user id "smoke-test". Run it against a development
or demo stack, and remove the records afterwards.

Usage:  python3 scripts/smoke-test.py
"""
import json
import subprocess
import sys

PASS = FAIL = 0

# Synthetic identity placed where API Gateway's JWT authorizer would put it.
CLAIMS = {"sub": "smoke-test", "name": "Smoke Test", "email": "smoke@example.com"}


_ALL_FUNCTIONS = None


def _all_functions():
    """All deployed Lambda names, fetched once (list-functions is paginated, so
    a server-side `contains(...)|[0]` query can return a per-page result and
    miss matches once the account has enough functions)."""
    global _ALL_FUNCTIONS
    if _ALL_FUNCTIONS is None:
        r = subprocess.run(
            ["aws", "lambda", "list-functions",
             "--query", "Functions[].FunctionName", "--output", "json"],
            capture_output=True, text=True)
        _ALL_FUNCTIONS = json.loads(r.stdout or "[]")
    return _ALL_FUNCTIONS


def fn(substr):
    """Find the deployed Lambda whose name contains `substr`."""
    for name in _all_functions():
        if substr in name:
            return name
    return ""


def event(body=None, path=None):
    e = {"requestContext": {"authorizer": {"jwt": {"claims": CLAIMS}}}}
    if body is not None:
        e["body"] = json.dumps(body)
    if path is not None:
        e["pathParameters"] = path
    return json.dumps(e)


def invoke(name, payload):
    with open("/tmp/smoke-payload.json", "w") as f:
        f.write(payload)
    subprocess.run(
        ["aws", "lambda", "invoke", "--function-name", name,
         "--payload", "fileb:///tmp/smoke-payload.json", "/tmp/smoke-resp.json"],
        capture_output=True, text=True)
    with open("/tmp/smoke-resp.json") as f:
        return f.read()


def check(label, resp, want="2"):
    """`want` is a status prefix ("2" = any 2xx) or an exact code ("400")."""
    global PASS, FAIL
    try:
        code = str(json.loads(resp)["statusCode"])
    except Exception:
        code = "???"
    ok = code.startswith(want) if len(want) == 1 else code == want
    if ok:
        print(f"PASS  {label}  ({code})")
        PASS += 1
    else:
        print(f"FAIL  {label}  -> {resp[:200]}")
        FAIL += 1
    return resp


def body_id(resp, key):
    try:
        return json.loads(json.loads(resp)["body"])[key]
    except Exception:
        return None


# Events and RSVP
r = check("create event", invoke(fn("CreateEventFn"), event(body={
    "title": "Smoke test event", "description": "d", "location": "Campus",
    "startsAt": "2030-01-01T18:00:00Z"})), "201")
eid = body_id(r, "eventId")
check("list events", invoke(fn("ListEventsFn"), event()), "200")
check("get event", invoke(fn("GetEventFn"), event(path={"eventId": eid})), "200")
check("rsvp", invoke(fn("RsvpToEventFn"), event(body={}, path={"eventId": eid})))
check("list attendees", invoke(fn("ListAttendeesFn"), event(path={"eventId": eid})), "200")
check("my rsvps", invoke(fn("ListMyRsvpsFn"), event()), "200")

# Posts, likes, comments
r = check("create post", invoke(fn("CreatePostFn"), event(body={"content": "Smoke test post"})), "201")
pid = body_id(r, "postId")
check("list posts", invoke(fn("ListPostsFn"), event()), "200")
check("list posts by author",
      invoke(fn("ListPostsFn"), json.dumps({"requestContext": {"authorizer": {"jwt": {"claims": CLAIMS}}},
             "queryStringParameters": {"authorId": "smoke-test"}})), "200")
# Open chat room: anyone may post; the message must NOT leak into the global feed.
r = check("post to open chat room",
          invoke(fn("CreatePostFn"), event(body={"content": "smoke chat msg", "groupId": "chat-general"})), "201")
chat_id = body_id(r, "postId")
feed = invoke(fn("ListPostsFn"), event())
try:
    leaked = "smoke chat msg" in json.loads(json.loads(feed)["body"])["items"].__str__()
except Exception:
    leaked = True
if leaked:
    print("FAIL  chat-room message leaked into the global feed")
    FAIL += 1
else:
    print("PASS  chat-room message stays out of the global feed")
    PASS += 1
check("bad pagination token rejected",
      invoke(fn("ListPostsFn"), json.dumps({"requestContext": {"authorizer": {"jwt": {"claims": CLAIMS}}},
             "queryStringParameters": {"nextToken": "not-a-token"}})), "400")
check("toggle like", invoke(fn("ToggleLikeFn"), event(body={}, path={"postId": pid})))
r = check("create comment", invoke(fn("CreateCommentFn"), event(body={"content": "nice"}, path={"postId": pid})))
cid = body_id(r, "commentId")
check("list comments", invoke(fn("ListCommentsFn"), event(path={"postId": pid})), "200")
check("edit comment (author)",
      invoke(fn("UpdateCommentFn"), event(body={"content": "edited"}, path={"postId": pid, "commentId": cid})), "200")
check("delete comment (author)",
      invoke(fn("DeleteCommentFn"), event(path={"postId": pid, "commentId": cid})), "204")
check("delete comment (non-author forbidden)",
      invoke(fn("DeleteCommentFn"),
             json.dumps({"requestContext": {"authorizer": {"jwt": {"claims":
                 {"sub": "smoke-other", "name": "Other"}}}},
                 "pathParameters": {"postId": pid, "commentId": "missing#x"}})),
      "403")

# Groups
r = check("create group", invoke(fn("CreateGroupFn"), event(body={"name": "Smoke Club", "description": "demo"})), "201")
gid = body_id(r, "groupId")
check("list groups", invoke(fn("ListGroupsFn"), event()), "200")
check("get group", invoke(fn("GetGroupFn"), event(path={"groupId": gid})), "200")
check("join group", invoke(fn("JoinGroupFn"), event(body={}, path={"groupId": gid})))
check("my groups", invoke(fn("ListMyGroupsFn"), event()), "200")
check("group members", invoke(fn("ListMembersFn"), event(path={"groupId": gid})), "200")

# Direct messaging
# Recipient profile must exist and be active. upsert a second user "smoke-dm".
invoke(fn("UpsertProfileFn"),
       json.dumps({"requestContext": {"authorizer": {"jwt": {"claims":
           {"sub": "smoke-dm", "name": "Smoke DM", "email": "dm@example.com"}}}},
           "body": json.dumps({"name": "Smoke DM", "major": "CS", "interests": [], "bio": "x"})}))
r = check("send direct message",
          invoke(fn("SendMessageFn"), event(body={"to": "smoke-dm", "content": "hi there"})), "201")
conv_id = body_id(r, "conversationId")
check("send message to self rejected",
      invoke(fn("SendMessageFn"), event(body={"to": "smoke-test", "content": "x"})), "400")
check("list conversations", invoke(fn("ListConversationsFn"), event()), "200")
check("get conversation messages",
      invoke(fn("GetMessagesFn"), event(path={"conversationId": conv_id})), "200")
# A non-participant must not read the thread.
check("non-participant cannot read conversation",
      invoke(fn("GetMessagesFn"),
             json.dumps({"requestContext": {"authorizer": {"jwt": {"claims":
                 {"sub": "smoke-outsider", "name": "Out"}}}},
                 "pathParameters": {"conversationId": conv_id}})),
      "403")
check("user directory", invoke(fn("ListProfilesFn"), event()), "200")

# Recommendations
check("recommendations", invoke(fn("GetRecommendationsFn"), event()), "200")

# Notifications
check("list notifications", invoke(fn("ListNotificationsFn"), event()), "200")
check("mark notifications read", invoke(fn("MarkNotificationsReadFn"), event(body={})), "200")

# Activity, profiles
check("activity digest", invoke(fn("GetActivityFn"), event()), "200")
check("upsert profile", invoke(fn("UpsertProfileFn"), event(body={"major": "CS", "interests": ["tech"], "bio": "hi"})))
check("get profile", invoke(fn("GetProfileFn"), event()), "200")

# Moderation and uploads
check("moderation rejects abusive text",
      invoke(fn("CreatePostFn"), event(body={"content": "you stupid idiot sh1t"})), "400")
check("upload presign",
      invoke(fn("GetUploadUrlFn"), event(body={"fileName": "a.png", "contentType": "image/png", "scope": "posts"})), "200")

print(f"\nRESULT: {PASS} passed, {FAIL} failed")
print(f"Created: event={eid} post={pid} group={gid}")
sys.exit(0 if FAIL == 0 else 1)
