import Benchmark from "benchmark";
import { createTV } from "tailwind-variants";
import { createClassmix } from "../src/main";
import { twMerge } from "tailwind-merge";

const tv = createTV();
const cx = createClassmix(twMerge);

// Scenario types
const SCENARIOS = [
  "Initialization", // Component definition
  "Initialization with inheritance",
  "First render", // First render of component
  "Repeated render", // Multiple renders with same props
  "Props change", // Re-render due to props change
  "Component lifecycle", // Complete component lifecycle
  "Compound slots render", // Test compoundSlots/$share functionality
];

// Function to generate config - enhanced version includes compoundSlots/$share
function generateConfig(slotsCount, variantsCount, compoundCount) {
  const config = {
    base: "base-class",
    variants: {},
    compoundVariants: [],
    defaultVariants: {},
  };

  // Add slots (if slotsCount > 1)
  if (slotsCount > 1) {
    config.slots = {};
    for (let i = 1; i < slotsCount; i++) {
      config.slots[`slot${i}`] = `slot${i}-class`;
    }
  }

  // Add variants
  for (let i = 0; i < variantsCount; i++) {
    const variantName = `variant${i}`;
    config.variants[variantName] = {
      a: {},
      b: {},
    };

    // Add base variants
    config.variants[variantName].a.base = `${variantName}-a-base`;
    config.variants[variantName].b.base = `${variantName}-b-base`;

    // Add other slots variants (if any)
    if (slotsCount > 1) {
      for (let j = 1; j < slotsCount; j++) {
        const slotName = `slot${j}`;
        config.variants[variantName].a[
          slotName
        ] = `${variantName}-a-${slotName}`;
        config.variants[variantName].b[
          slotName
        ] = `${variantName}-b-${slotName}`;
      }
    }

    // Set default variant
    config.defaultVariants[variantName] = "a";
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

    config.compoundVariants.push(compound);
  }

  // Add compoundSlots to tv
  if (slotsCount > 1) {
    config.compoundSlots = [];

    // Add some compoundSlots without conditions (always applied)
    config.compoundSlots.push({
      slots: slotNames(slotsCount, 3), // Select first 3 slots or all
      class: "flex items-center justify-center",
    });

    // Add some compoundSlots with conditions
    if (variantsCount > 0) {
      config.compoundSlots.push({
        slots: slotNames(slotsCount, 2),
        variant0: "a",
        class: "bg-blue-100 text-blue-800",
      });
    }

    if (variantsCount > 1) {
      config.compoundSlots.push({
        slots: slotNames(slotsCount, 2),
        variant1: "b",
        class: "rounded-full shadow-sm",
      });
    }
  }

  // Add compound variants with $share to cx
  if (slotsCount > 1) {
    // Add some compound variants with $share
    config.compoundVariants.push({
      $when: (context) => true, // Always applied
      class: "always-applied",
      $share: {
        slots: slotNames(slotsCount, 3).slice(1), // Exclude base from first 3 slots
        class: "shared-always",
      },
    });

    if (variantsCount > 0) {
      config.compoundVariants.push({
        variant0: "a",
        class: "variant0-a-compound",
        $share: {
          slots: slotNames(slotsCount, 2).slice(1),
          class: "shared-variant0-a",
        },
      });
    }

    if (variantsCount > 1) {
      config.compoundVariants.push({
        $when: (context) => context.variant1 === "b",
        class: "variant1-b-compound",
        $share: {
          slots: slotNames(slotsCount, 2).slice(1),
          class: (context) => `shared-variant1-b-${context.variant0}`,
        },
      });
    }
  }

  return config;
}

// Helper function: generate slot names array
function slotNames(slotsCount, limit) {
  const result = ["base"];
  const max = Math.min(slotsCount, limit + 1);

  for (let i = 1; i < max; i++) {
    result.push(`slot${i}`);
  }

  return result;
}

// Function to run a single test configuration
async function runTest(slotsCount, variantsCount, compoundCount) {
  console.log(`\n========================================`);
  console.log(
    `Test: ${slotsCount} slots, ${variantsCount} variants, ${compoundCount} compound variants`
  );
  console.log(`========================================`);

  const config = generateConfig(slotsCount, variantsCount, compoundCount);
  const hasSlots = slotsCount > 1;

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

  // Get slot names
  const slotNames = ["base"];
  if (hasSlots) {
    for (let i = 1; i < slotsCount; i++) {
      slotNames.push(`slot${i}`);
    }
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
          .add(`cx: ${scenario}`, function () {
            cx(config);
          });
        break;
      case "Initialization with inheritance":
        suite
          .add(`tv: ${scenario}`, function () {
            tv({ extend: tv(config) });
          })
          .add(`cx: ${scenario}`, function () {
            cx({ extends: cx(config) });
          });
        break;

      case "First render":
        if (hasSlots) {
          // With slots
          suite
            .add(`tv: ${scenario}`, function () {
              const result = tv(config)({});
              result.base();
              if (slotNames.length > 1) result[slotNames[1]]();
            })
            .add(`cx: ${scenario}`, function () {
              const result = cx(config)({});
              result.base();
              if (slotNames.length > 1) result[slotNames[1]]();
            });
        } else {
          // Without slots
          suite
            .add(`tv: ${scenario}`, function () {
              const result = tv(config)({});
            })
            .add(`cx: ${scenario}`, function () {
              const result = cx(config)({});
              result.base(); // cx always uses .base()
            });
        }
        break;

      case "Repeated render": {
        if (hasSlots) {
          // With slots
          const tvComponent = tv(config);
          const cxComponent = cx(config);

          suite
            .add(`tv: ${scenario}`, function () {
              const result = tvComponent({});
              result.base();
              if (slotNames.length > 1) result[slotNames[1]]();
            })
            .add(`cx: ${scenario}`, function () {
              const result = cxComponent({});
              result.base();
              if (slotNames.length > 1) result[slotNames[1]]();
            });
        } else {
          // Without slots
          const tvComponent = tv(config);
          const cxComponent = cx(config);

          suite
            .add(`tv: ${scenario}`, function () {
              const result = tvComponent({});
            })
            .add(`cx: ${scenario}`, function () {
              const result = cxComponent({});
              result.base(); // cx always uses .base()
            });
        }
        break;
      }

      case "Props change": {
        if (hasSlots) {
          // With slots
          const tvComponent = tv(config);
          const cxComponent = cx(config);
          let propIndex = 0;

          suite
            .add(`tv: ${scenario}`, function () {
              const props = propsVariations[propIndex % propsVariations.length];
              propIndex++;

              const result = tvComponent(props);
              result.base();
              if (slotNames.length > 1) result[slotNames[1]]();
            })
            .add(`cx: ${scenario}`, function () {
              const props = propsVariations[propIndex % propsVariations.length];
              propIndex++;

              const result = cxComponent(props);
              result.base();
              if (slotNames.length > 1) result[slotNames[1]]();
            });
        } else {
          // Without slots
          const tvComponent = tv(config);
          const cxComponent = cx(config);
          let propIndex = 0;

          suite
            .add(`tv: ${scenario}`, function () {
              const props = propsVariations[propIndex % propsVariations.length];
              propIndex++;

              const result = tvComponent(props);
            })
            .add(`cx: ${scenario}`, function () {
              const props = propsVariations[propIndex % propsVariations.length];
              propIndex++;

              const result = cxComponent(props);
              result.base(); // cx always uses .base()
            });
        }
        break;
      }

      case "Component lifecycle":
        if (hasSlots) {
          // With slots
          suite
            .add(`tv: ${scenario}`, function () {
              const component = tv(config);

              // Simulate multiple renders in component lifecycle
              for (let i = 0; i < 5; i++) {
                const props = propsVariations[i % propsVariations.length];
                const result = component(props);

                result.base();
                // Access different slots in each render
                const slotIndex = 1 + (i % (slotNames.length - 1));
                if (slotNames.length > slotIndex) {
                  result[slotNames[slotIndex]]();
                }
              }
            })
            .add(`cx: ${scenario}`, function () {
              const component = cx(config);

              for (let i = 0; i < 5; i++) {
                const props = propsVariations[i % propsVariations.length];
                const result = component(props);

                result.base();
                const slotIndex = 1 + (i % (slotNames.length - 1));
                if (slotNames.length > slotIndex) {
                  result[slotNames[slotIndex]]();
                }
              }
            });
        } else {
          // Without slots
          suite
            .add(`tv: ${scenario}`, function () {
              const component = tv(config);

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
                result.base(); // cx always uses .base()
              }
            });
        }
        break;

      case "Compound slots render":
        if (hasSlots) {
          // Test compoundSlots/$share functionality - with slots
          const tvComponent = tv(config);
          const cxComponent = cx(config);

          suite
            .add(`tv: ${scenario}`, function () {
              const result = tvComponent({ variant0: "a", variant1: "b" });

              // Access all slots to test compoundSlots
              for (let i = 0; i < Math.min(slotNames.length, 4); i++) {
                result[slotNames[i]]();
              }
            })
            .add(`cx: ${scenario}`, function () {
              const result = cxComponent({ variant0: "a", variant1: "b" });

              // Access all slots to test $share
              for (let i = 0; i < Math.min(slotNames.length, 4); i++) {
                result[slotNames[i]]();
              }
            });
        } else {
          // Without slots - simple test
          const tvComponent = tv(config);
          const cxComponent = cx(config);

          suite
            .add(`tv: ${scenario}`, function () {
              const result = tvComponent({ variant0: "a", variant1: "b" });
            })
            .add(`cx: ${scenario}`, function () {
              const result = cxComponent({ variant0: "a", variant1: "b" });
              result.base();
            });
        }
        break;
    }

    // Run tests
    await new Promise((resolve) => {
      suite
        .on("cycle", (event) => {
          console.log(String(event.target));
        })
        .on("complete", function () {
          // Find the fastest implementation
          const fastest = this.filter("fastest").map("name");
          console.log(`Fastest: ${fastest}`);

          // Calculate difference
          let tvResult, cxResult;
          this.forEach((benchmark) => {
            if (benchmark.name.startsWith("tv:")) {
              tvResult = benchmark;
            } else if (benchmark.name.startsWith("cx:")) {
              cxResult = benchmark;
            }
          });

          if (tvResult && cxResult) {
            const tvHz = tvResult.hz;
            const cxHz = cxResult.hz;
            const ratio = tvHz / cxHz;
            const faster = ratio > 1 ? "tv" : "cx";
            const percentage = Math.abs((ratio - 1) * 100).toFixed(2);
            console.log(`${faster} is faster by ${percentage}%`);
          }

          resolve();
        })
        .run({ async: true });
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
