import React from 'react';
import { EventUpdateForm } from "../../ui-components"; // Import from Amplify UI

const Events = () => {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Events</h1>
            <p className="mt-2 text-gray-600">
                Welcome to the events page. Here you can find all the upcoming events.
            </p>
            <div className="mt-4">
                <EventUpdateForm /> {/* Use Figma-designed event update form */}
            </div>
        </div>
    );
};

export default Events;
