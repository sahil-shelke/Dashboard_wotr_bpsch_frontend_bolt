import { State, District, Block } from '../types/location';

const API_BASE_URL = 'http://localhost:8000';
const LANGUAGE_ID = 1;

export const locationApi = {
  async getStates(token: string): Promise<State[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/location/states?language_id=${LANGUAGE_ID}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch states');
    }

    return response.json();
  },

  async getDistricts(token: string, stateCode: string): Promise<District[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/location/districts?language_id=${LANGUAGE_ID}&state_code=${stateCode}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch districts');
    }

    return response.json();
  },

  async getBlocks(
    token: string,
    stateCode: string,
    districtCode: string
  ): Promise<Block[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/location/blocks?language_id=${LANGUAGE_ID}&state_code=${stateCode}&district_code=${districtCode}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch blocks');
    }

    return response.json();
  },
};
