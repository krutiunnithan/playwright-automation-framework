/**
 * ============================================================================
 * Rules Engine Utility
 * -------------------------------------------------------------------------
 * Utility class to generate synthetic datasets for Salesforce modules such
 * as 'contact' and 'case', based on JSON-defined rules.
 * 
 * This class is typically used by TestDataFactory or other test utilities
 * to generate realistic, yet randomized test data.
 * ============================================================================
*/
import * as fs from 'fs';
import * as path from 'path';

/**
 * ============================================================================
 * RulesEngine
 * ----------------------------------------------------------------------------
 * Helper class to create combination of test data-set.
 * ============================================================================
 */
export class RulesEngine {
  private static pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  static async generate(module: 'contact' | 'case'): Promise<any> {

    // Construct absolute path to the JSON rules file
    const rulesFile = path.resolve(__dirname, '../../data/json', `${module}-synthetic.json`);

    // Read and parse the JSON rules
    const rawData = fs.readFileSync(rulesFile, 'utf-8');
    const rules = JSON.parse(rawData);

    const dataset: any = {};

    // Iterate over all fields defined in rules
    for (const [field, config] of Object.entries<any>(rules)) {

      // Skip if config is missing
      if (!config) continue;

      // ------------------------------
      // Constrained Potential Value
      // ------------------------------
      if (config.constrainedPotentialValue) {

        const constraints = config.constrainedPotentialValue;

        // Determine which parent key is relevant
        const parentKey = Object.keys(constraints).find(key =>
          Object.values(dataset).includes(key)
        );

        if (parentKey) {
          dataset[field] = this.pickRandom(constraints[parentKey]);
          continue;
        }

        // fallback – pick first key's array
        const firstKey = Object.keys(constraints)[0];
        dataset[field] = this.pickRandom(constraints[firstKey]);
        continue;
      }

      // ------------------------------
      // Normal potentialValue handling
      // ------------------------------
      if (config.potentialValue) {
        dataset[field] = this.pickRandom(config.potentialValue);
        continue;
      }
    }

    return dataset;
  }
}
