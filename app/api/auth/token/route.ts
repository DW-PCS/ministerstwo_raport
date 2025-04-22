import axios from 'axios';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface TokenRequestBody {
  code: string;
  codeVerifier?: string;
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
    const body: TokenRequestBody = await request.json();
    const { code, codeVerifier } = body;


    const headersList = await headers();
    const origin = headersList.get('origin') || request.nextUrl.origin;


    const redirectUri = `${origin}/auth/azure-ad`;

    const params = new URLSearchParams();
    if (!process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID || !process.env.NEXT_PUBLIC_AZURE_AD_ENDPOINT|| !process.env.NEXT_PUBLIC_AZURE_AD_SCOPE) {
        throw new Error('env variable is not defined in the environment variables.');
    }

    params.append('client_id', process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('scope', process.env.NEXT_PUBLIC_AZURE_AD_SCOPE);

    if (codeVerifier) {
      params.append('code_verifier', codeVerifier);
    }

    const response = await axios.post<TokenResponse>(process.env.NEXT_PUBLIC_AZURE_AD_ENDPOINT, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': origin
      }
    });

    return NextResponse.json(response.data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorResponse = axios.isAxiosError(error) && error.response?.data
      ? (error.response.data as ErrorResponse)
      : { error: errorMessage };

    console.error('Token exchange error:', errorResponse);
    return NextResponse.json(
      { error: errorResponse.error_description || errorResponse.error },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
