import React from "react";
import {
  Features2x2,
  ActionCard,
  DataRow,
  ProfileCard,
  StandardCard
} from "../../ui-components";

const MainContent = () => {
  return (
    <div className="dashboard-container">
      {/* Top Section with Profile and Quick Actions */}
      <div className="flex gap-4 mb-6">
        <div className="w-1/3">
          <ProfileCard
            overrides={{
              Frame: { style: { width: "100%" } }
            }}
          />
        </div>
        <div className="w-2/3">
          <ActionCard
            heading="Quick Actions"
            overrides={{
              Frame: { style: { width: "100%" } }
            }}
          />
        </div>
      </div>

      {/* Main Features Grid */}
      <Features2x2
        overrides={{
          Frame: {
            style: {
              marginBottom: "2rem",
            }
          }
        }}
      />

      {/* Activity Feed */}
      <StandardCard
        title="Recent Activity"
        overrides={{
          Frame: { style: { width: "100%" } }
        }}
      >
        <div className="activity-feed">
          <DataRow
            label="New Post"
            description="John shared a new update"
            timestamp="5m ago"
          />
          <DataRow
            label="Event"
            description="Upcoming Campus Meetup"
            timestamp="1h ago"
          />
          <DataRow
            label="Group"
            description="Study Group Discussion"
            timestamp="2h ago"
          />
        </div>
      </StandardCard>
    </div>
  );
};

export default MainContent;

