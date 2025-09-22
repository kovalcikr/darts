import {describe, expect, test, jest} from '@jest/globals';
import { GET } from '../../../../app/api/tournaments/[id]/route';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Tournament API', () => {
    test('should return tournament data', async () => {
        const mockData = {
            "tournamentId": 12345,
            "name": "Test Tournament",
        };
        mockedAxios.get.mockResolvedValue({ data: mockData });

        const response = await GET(new Request('http://localhost/'), { params: { id: '12345' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(mockData);
    });
});
