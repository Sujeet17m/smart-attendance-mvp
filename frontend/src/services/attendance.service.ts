import axios from 'axios';

const API_URL = '/api/attendance';

interface MarkAttendanceResponse {
  id: string;
  userId: string;
  date: string;
  time: string;
  status: 'present' | 'absent' | 'late';
}

export const markAttendance = async (
  token: string,
  imageData: string
): Promise<MarkAttendanceResponse> => {
  try {
    const response = await axios.post(
      `${API_URL}/mark`,
      { imageData },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAttendanceByDate = async (token: string, date: string) => {
  try {
    const response = await axios.get(`${API_URL}/by-date/${date}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAttendanceByUser = async (token: string, userId: string) => {
  try {
    const response = await axios.get(`${API_URL}/by-user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};