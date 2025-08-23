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
    this.baseUrl = 'https://api.airtable.com/v0/app4cbr97pcHjtLen/Transactions';
    this.apiKey = process.env.AIRTABLE_API_KEY || 'patpMbwJgg5pKSb4t.85edd7ec26dd8c2f421ec033f312eec5ba5bd1ef5b0f7ee765492bb94c14550b';
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
    const response: AirtableResponse = await this.makeRequest('GET');
    return response.records;
  }

  async createRecord(fields: {
    Type: string;
    DebitAmount?: number;
    CreditAmount?: number;
    Date: string;
    Notes?: string;
  }): Promise<AirtableRecord> {
    const response = await this.makeRequest('POST', '', {
      fields
    });
    return response;
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
