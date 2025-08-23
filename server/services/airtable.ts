interface AirtableRecord {
  id: string;
  fields: {
    Type: string;
    DebitAmount?: number;
    CreditAmount?: number;
    Date: string;
    Notes?: string;
  };
}

interface AirtableResponse {
  records: AirtableRecord[];
}

class AirtableService {
  private baseUrl: string;
  private apiKey: string;
  
  constructor() {
    // Use environment variables for security
    const apiKey = process.env.AIRTABLE_API_KEY || 'patpMbwJgg5pKSb4t.85edd7ec26dd8c2f421ec033f312eec5ba5bd1ef5b0f7ee765492bb94c14550b';
    const baseId = process.env.AIRTABLE_BASE_ID || 'app4cbr97pcHjtLen';
    const tableName = process.env.AIRTABLE_TABLE_NAME || 'Transactions';
    
    if (!apiKey || !baseId || !tableName) {
      console.error('Missing Airtable configuration');
    }
    
    this.baseUrl = `https://api.airtable.com/v0/${baseId}/${tableName}`;
    this.apiKey = apiKey;
  }

  private async makeRequest(method: string, endpoint: string = '', data?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getAllRecords(): Promise<AirtableRecord[]> {
    try {
      console.log('Fetching records from Airtable...');
      const response: AirtableResponse = await this.makeRequest('GET');
      console.log(`Successfully fetched ${response.records.length} records`);
      return response.records;
    } catch (error) {
      console.error('Failed to fetch from Airtable:', error);
      console.error('Base URL:', this.baseUrl);
      console.error('API Key (first 10 chars):', this.apiKey.substring(0, 10) + '...');
      // Return empty array if Airtable is unavailable
      return [];
    }
  }

  async createRecord(fields: {
    Type: string;
    DebitAmount?: number;
    CreditAmount?: number;
    Date: string;
    Notes?: string;
  }): Promise<AirtableRecord | null> {
    try {
      const response = await this.makeRequest('POST', '', {
        fields
      });
      return response;
    } catch (error) {
      console.error('Failed to create record in Airtable:', error);
      return null;
    }
  }

  async updateRecord(recordId: string, fields: Partial<{
    Type: string;
    DebitAmount?: number;
    CreditAmount?: number;
    Date: string;
    Notes?: string;
  }>): Promise<AirtableRecord> {
    const response = await this.makeRequest('PATCH', `/${recordId}`, {
      fields
    });
    return response;
  }

  async deleteRecord(recordId: string): Promise<void> {
    await this.makeRequest('DELETE', `/${recordId}`);
  }
}

export const airtableService = new AirtableService();
