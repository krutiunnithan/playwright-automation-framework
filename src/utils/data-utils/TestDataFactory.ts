import { RulesEngine } from "@utils/data-utils/RulesEngine";


export type DataSource = 'synthetic' | 'soql' | 'combined';

export class TestDataFactory {
  static async getData(module: 'contact' | 'case', data_source: DataSource) {
    switch (data_source) {
      case 'synthetic':
        return await RulesEngine.generate(module);
      case 'soql':
        // TODO: integrate Salesforce query
        throw new Error('SOQL data source not implemented yet');
      case 'combined':
        // TODO: merge synthetic + SOQL
        throw new Error('Combined data source not implemented yet');
      default:
        throw new Error(`Unknown data source: ${data_source}`);
    }
  }
}
