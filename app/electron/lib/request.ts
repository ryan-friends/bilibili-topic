import axiosRetry from 'axios-retry';
import axios from 'axios';

export async function get(url: string) {
  try {
    const client = axios.create({});
    axiosRetry(client, {
      retries: 5,
      retryDelay: (retryCount, error) => {
        console.log(error);
        return retryCount * 1000;
      },
    });
    const res: any = await client({
      url,
      method: 'GET',
      timeout: 5000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36',
      },
    });
    if (res.data.code !== 0) {
      console.log(res);
      throw new Error(`${res.code}_${res.msg}_${res.message}`);
    }
    return res.data.data;
  } catch (err) {
    throw err;
  }
}
