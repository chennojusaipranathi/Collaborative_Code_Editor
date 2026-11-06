import { useEffect, useState } from "react";
import * as roomService from "../services/roomService";

export default function useRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true; // stops updates if the page is closed mid-request

    roomService
      .getRooms()
      .then((data) => {
        if (active) setRooms(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Add a new room to the top of the list without reloading
  const addRoom = (room) => setRooms((current) => [room, ...current]);

  return { rooms, loading, error, addRoom };
}