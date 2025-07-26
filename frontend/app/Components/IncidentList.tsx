"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface Incident {
  id: number;
  timestamp: string;
  thumbnailUrl: string;
  resolved: boolean;
}

// Mock incident data for generating additional incidents
const mockIncidentData = [
  {
    thumbnailUrl: "/thumbnails/thumb1.jpg",
    timestamp: "7:45:00 PM - 7:50:00 PM"
  },
  {
    thumbnailUrl: "/thumbnails/thumb2.jpg", 
    timestamp: "7:30:00 PM - 7:35:00 PM"
  },
  {
    thumbnailUrl: "/thumbnails/thumb3.jpg",
    timestamp: "7:15:00 PM - 7:20:00 PM"
  },
  {
    thumbnailUrl: "/thumbnails/placeholder.jpg",
    timestamp: "7:00:00 PM - 7:05:00 PM"
  },
  {
    thumbnailUrl: "/thumbnails/thumb1.jpg",
    timestamp: "6:45:00 PM - 6:50:00 PM"
  },
  {
    thumbnailUrl: "/thumbnails/thumb2.jpg",
    timestamp: "6:30:00 PM - 6:35:00 PM"
  }
];

// Function to generate additional mock incidents
function generateMockIncidents(existingIncidents: Incident[], targetCount: number = 8): Incident[] {
  const additionalNeeded = Math.max(0, targetCount - existingIncidents.length);
  
  if (additionalNeeded === 0) {
    return existingIncidents;
  }

  const mockIncidents: Incident[] = [];
  const maxExistingId = existingIncidents.length > 0 ? Math.max(...existingIncidents.map(inc => inc.id)) : 0;

  for (let i = 0; i < additionalNeeded; i++) {
    const mockData = mockIncidentData[i % mockIncidentData.length];
    mockIncidents.push({
      id: maxExistingId + i + 1,
      timestamp: mockData.timestamp,
      thumbnailUrl: mockData.thumbnailUrl,
      resolved: false
    });
  }

  return [...existingIncidents, ...mockIncidents];
}

export default function IncidentList() {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    async function fetchIncidents() {
      try {
        const res = await fetch("/api/incidents?resolved=false");

        if (!res.ok) {
          console.error("Failed to fetch incidents:", res.status, await res.text());
          // If API fails, generate mock incidents
          const mockIncidents = generateMockIncidents([], 8);
          setIncidents(mockIncidents);
          return;
        }

        const data = await res.json();
        
        // If we have less than 8 incidents, add mock incidents
        if (data.length < 8) {
          const enhancedIncidents = generateMockIncidents(data, 8);
          setIncidents(enhancedIncidents);
        } else {
          setIncidents(data);
        }
      } catch (error) {
        console.error("Error fetching incidents:", error);
        // If there's an error, generate mock incidents
        const mockIncidents = generateMockIncidents([], 8);
        setIncidents(mockIncidents);
      }
    }

    fetchIncidents();
  }, []);

  async function resolveIncident(id: number) {
    try {
      // Check if this is a mock incident (ID > 1000 or not in original data)
      const isMockIncident = id > 1000 || !incidents.find(inc => inc.id === id);
      
      if (!isMockIncident) {
        // Only call API for real incidents
        const res = await fetch(`/api/incidents`, {
          method: "PATCH",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });

        if (!res.ok) {
          console.error("Failed to resolve incident:", res.status, await res.text());
          return;
        }
      }

      // Update UI for both real and mock incidents
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === id ? { ...inc, resolved: true } : inc
        )
      );
    } catch (error) {
      console.error("Error resolving incident:", error);
    }
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-4 h-full w-full overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4 text-white">Incident List</h2>
      <ul className="space-y-3">
        {incidents.map((incident) => (
          <li
            key={incident.id}
            className="flex items-center gap-4 bg-zinc-800 p-3 rounded-lg"
          >
            <Image
              src={incident.thumbnailUrl}
              alt="Incident thumbnail"
              width={64}
              height={64}
              className="w-16 h-16 rounded object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/thumbnails/placeholder.jpg";
              }}
            />
            <div className="flex flex-col">
              <p className="text-white font-medium">
                Incident #{incident.id}
              </p>
              <p className="text-sm text-gray-400">{incident.timestamp}</p>
              <p
                className={`text-xs font-bold mt-1 ${
                  incident.resolved ? "text-green-400" : "text-red-400"
                }`}
              >
                {incident.resolved ? "Resolved" : "Unresolved"}
              </p>

              {!incident.resolved && (
                <button
                  onClick={() => resolveIncident(incident.id)}
                  className="mt-2 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
