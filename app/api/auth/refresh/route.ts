import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

interface RefreshTokenRequestBody {
  refreshToken: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface ErrorResponse {
  error: string;
  error_description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RefreshTokenRequestBody = await request.json();
    const { refreshToken } = body;
    const params = new URLSearchParams();

    if (
      !process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID ||
      !process.env.NEXT_PUBLIC_AZURE_AD_ENDPOINT ||
      !process.env.NEXT_PUBLIC_AZURE_AD_SCOPE
    ) {
      throw new Error('env variable is not defined in the environment variables.');
    }

    params.append('client_id', process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID);
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);
    params.append('scope', process.env.NEXT_PUBLIC_AZURE_AD_SCOPE);

    const response = await axios.post<TokenResponse>(
      process.env.NEXT_PUBLIC_AZURE_AD_ENDPOINT,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorResponse =
      axios.isAxiosError(error) && error.response?.data
        ? (error.response.data as ErrorResponse)
        : { error: errorMessage };

    console.error('Token refresh error:', errorResponse);
    return NextResponse.json(
      { error: errorResponse.error_description || errorResponse.error },
      { status: 500 }
    );
  }
}
