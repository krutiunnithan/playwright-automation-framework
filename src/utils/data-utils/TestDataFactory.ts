import { DataSource } from "@data/enums/data-sources.enums";
import { SalesforceModule } from "@data/enums/modules.enums";
import { RulesEngine } from "@utils/data-utils/RulesEngine";

/**
 * ============================================================================
 * TestDataFactory
 * ----------------------------------------------------------------------------
 * Class to provide data-set based on DataSource value provided.
 * ============================================================================
 */
export class TestDataFactory {

  static async getData(module: SalesforceModule, dataSource: DataSource) {
    switch (dataSource) {
      case DataSource.SYNTHETIC:
        return await RulesEngine.generate(module);

      case DataSource.SOQL:
        // TODO: integrate Salesforce query
        throw new Error('SOQL data source not implemented yet');

      case DataSource.COMBINED:
        // TODO: merge synthetic + SOQL
        throw new Error('Combined data source not implemented yet');

      default:
        throw new Error(`Unknown data source: ${dataSource}`);
    }
  }
}
