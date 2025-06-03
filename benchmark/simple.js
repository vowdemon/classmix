import Benchmark from "benchmark";
import { createTV } from "tailwind-variants";
import { createClassmix } from "../dist/index.mjs";
import { cva } from "class-variance-authority";

const tv = createTV({ twMerge: false });
const cx = createClassmix();
const cv = cva;

// Scenario types
const SCENARIOS = [
  "Initialization", // Component definition
  "First render", // First render of component
  "Repeated render", // Multiple renders with same props
  "Props change", // Re-render due to props change
  "Component lifecycle", // Complete component lifecycle
];

// Function to generate config - enhanced version includes compoundSlots/$share
function generateConfig(variantsCount, compoundCount) {
  const base = "base";
  const variants = {};
  const compoundVariants = [];
  const defaultVariants = {};

  // Add variants
  for (let i = 0; i < variantsCount; i++) {
    const variantName = `variant${i}`;
    variants[variantName] = {
      a: {},
      b: {},
    };

    // Add base variants
    variants[variantName].a = `${variantName}-a`;
    variants[variantName].b = `${variantName}-b`;

    // Set default variant
    defaultVariants[variantName] = "a";
  }

  // Add compound variants
  for (let i = 0; i < compoundCount; i++) {
    const compound = {
      class: `compound${i}`,
    };

    // Add conditions (using first two variants, if exist)
    if (variantsCount > 0) {
      compound.variant0 = i % 2 === 0 ? "a" : "b";
    }
    if (variantsCount > 1) {
      compound.variant1 = i % 3 === 0 ? "a" : "b";
    }

    compoundVariants.push(compound);
  }

  return { base, variants, compoundVariants, defaultVariants };
}

// Function to run a single test configuration
async function runTest(variantsCount, compoundCount) {
  console.log(`\n========================================`);
  console.log(
    `Test: ${variantsCount} variants, ${compoundCount} compound variants`
  );
  console.log(`========================================`);

  const config = generateConfig(variantsCount, compoundCount);

  // Generate variant property combinations
  const propsVariations = [];
  for (let i = 0; i < Math.min(variantsCount, 5); i++) {
    const props = {};
    props[`variant${i}`] = i % 2 === 0 ? "a" : "b";
    propsVariations.push(props);
  }
  if (propsVariations.length === 0) {
    propsVariations.push({});
  }

  // Run tests for each scenario
  for (const scenario of SCENARIOS) {
    console.log(`\n--- Scenario: ${scenario} ---`);

    const suite = new Benchmark.Suite();

    switch (scenario) {
      case "Initialization":
        suite
          .add(`tv: ${scenario}`, function () {
            tv(config);
          })
          .add(`cv: ${scenario}`, function () {
            cv(config);
          })
          .add(`cx: ${scenario}`, function () {
            cx(config);
          });
        break;
      case "First render":
        suite
          .add(`tv: ${scenario}`, function () {
            const result = tv(config)({});
          })
          .add(`cv: ${scenario}`, function () {
            const result = cv(config)({});
          })
          .add(`cx: ${scenario}`, function () {
            const result = cx(config)({});
            result.base();
          });

        break;

      case "Repeated render": {
        const tvComponent = tv(config);
        const cvComponent = cv(config);
        const cxComponent = cx(config);

        suite
          .add(`tv: ${scenario}`, function () {
            const result = tvComponent({});
          })
          .add(`cv: ${scenario}`, function () {
            const result = cvComponent({});
          })
          .add(`cx: ${scenario}`, function () {
            const result = cxComponent({});
            result.base();
          });

        break;
      }

      case "Props change": {
        const tvComponent = tv(config);
        const cvComponent = cv(config);
        const cxComponent = cx(config);
        let propIndex = 0;

        suite
          .add(`tv: ${scenario}`, function () {
            const props = propsVariations[propIndex % propsVariations.length];
            propIndex++;
            const result = tvComponent(props);
          })
          .add(`cv: ${scenario}`, function () {
            const props = propsVariations[propIndex % propsVariations.length];
            propIndex++;
            const result = cvComponent(props);
          })
          .add(`cx: ${scenario}`, function () {
            const props = propsVariations[propIndex % propsVariations.length];
            propIndex++;
            const result = cxComponent(props);
            result.base();
          });

        break;
      }

      case "Component lifecycle":
        suite
          .add(`tv: ${scenario}`, function () {
            const component = tv(config);

            for (let i = 0; i < 5; i++) {
              const props = propsVariations[i % propsVariations.length];
              const result = component(props);
            }
          })
          .add(`cv: ${scenario}`, function () {
            const component = cv(config);

            for (let i = 0; i < 5; i++) {
              const props = propsVariations[i % propsVariations.length];
              const result = component(props);
            }
          })
          .add(`cx: ${scenario}`, function () {
            const component = cx(config);

            for (let i = 0; i < 5; i++) {
              const props = propsVariations[i % propsVariations.length];
              const result = component(props);
              result.base();
            }
          });

        break;
    }

    // Run tests
    await new Promise((resolve) => {
      suite
        .on("cycle", (event) => {
          console.log(String(event.target));
          resolve();
        })
        .run({ async: false });
    });
  }
}

// Run all test combinations
async function runAllTests() {
  console.log("Starting comprehensive benchmark tests...\n");

  // Selectively test key combinations to reduce test time
  const selectedSlots = [20];
  const selectedVariants = [20];
  const selectedCompounds = [20];

  for (const slotsCount of selectedSlots) {
    for (const variantsCount of selectedVariants) {
      for (const compoundCount of selectedCompounds) {
        try {
          await runTest(slotsCount, variantsCount, compoundCount);
        } catch (error) {
          console.error(
            `Test failed (${slotsCount} slots, ${variantsCount} variants, ${compoundCount} compound variants):`,
            error
          );
        }
      }
    }
  }

  console.log("\nAll tests completed!");
}

// Execute tests
runAllTests();
