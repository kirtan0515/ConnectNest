# Migration Steps for Auth Changes

To resolve the "transformer-user-pool" naming conflict and successfully migrate to API Key authentication, follow these steps:

1. First, remove the Cognito User Pool authentication:
```bash
amplify remove auth
```

2. Then, push the changes to remove the auth resources:
```bash
amplify push
```

3. After the auth resources are removed, the current changes in the codebase will take effect, implementing:
   - API Key as the default authentication method
   - Private/public authorization rules in the GraphQL schema
   - Removal of all Cognito User Pool dependencies

These steps must be executed in order to properly migrate the authentication system and resolve the naming conflict.

Note: This is a breaking change that will require updates to your frontend code to use API Key authentication instead of Cognito User Pools.