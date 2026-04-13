import type { Env } from '../../types';
import { getGoogleAdsAccessToken } from './adsAuth';

// TODO: Replace with the actual ConversionAction from your Google Ads account
const CONVERSION_ACTION_ID = 'REPLACE_WITH_YOUR_CONVERSION_ACTION_ID';

// See: https://developers.google.com/google-ads/api/rest/reference/rest/v16/customers/uploadClickConversions
type ClickConversion = {
  gclid: string;
  conversionAction: string;
  conversionValue: number;
  conversionDateTime: string;
  currencyCode: string;
  orderId?: string;
};

type UploadClickConversionsRequest = {
  conversions: ClickConversion[];
  partialFailure: boolean;
  validateOnly: boolean;
};

type UploadClickConversionsResponse = {
  partialFailureError?: {
    code: number;
    message: string;
    details: unknown[];
  };
  results: {
    gclid: string;
    conversionAction: string;
    conversionDateTime: string;
  }[];
};

const getGoogleAdsApiEndpoint = (customerId: string) =>
  `https://googleads.googleapis.com/v16/customers/${customerId}/clickConversions:upload`;

export const sendAdConversion = async (
  env: Env,
  gclid: string,
  orderId: string,
  conversionValue: number,
  conversionTime: Date,
): Promise<void> => {
  const {
    GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    GOOGLE_ADS_DEVELOPER_TOKEN,
    GOOGLE_ADS_CLIENT_ID,
    GOOGLE_ADS_CLIENT_SECRET,
    GOOGLE_ADS_REFRESH_TOKEN,
  } = env;

  if (
    !GOOGLE_ADS_LOGIN_CUSTOMER_ID ||
    !GOOGLE_ADS_DEVELOPER_TOKEN ||
    !GOOGLE_ADS_CLIENT_ID ||
    !GOOGLE_ADS_CLIENT_SECRET ||
    !GOOGLE_ADS_REFRESH_TOKEN
  ) {
    console.warn('Google Ads environment variables not set. Skipping conversion tracking.');
    return;
  }

  try {
    const accessToken = await getGoogleAdsAccessToken(env);

    const conversion: ClickConversion = {
      gclid,
      conversionAction: `customers/${GOOGLE_ADS_LOGIN_CUSTOMER_ID}/conversionActions/${CONVERSION_ACTION_ID}`,
      conversionValue,
      conversionDateTime: conversionTime.toISOString().replace(/\.\d{3}Z$/, '+00:00'),
      currencyCode: 'BRL',
      orderId,
    };

    const requestBody: UploadClickConversionsRequest = {
      conversions: [conversion],
      partialFailure: true,
      validateOnly: false, // Set to true for testing
    };

    const endpoint = getGoogleAdsApiEndpoint(GOOGLE_ADS_LOGIN_CUSTOMER_ID);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
        'login-customer-id': GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Ads API error:', errorText);
      throw new Error(`Google Ads API request failed with status ${response.status}`);
    }

    const responseData: UploadClickConversionsResponse = await response.json();
    console.log('Google Ads conversion upload successful:', responseData);
  } catch (error) {
    console.error('Failed to send Google Ads conversion:', error);
  }
};
