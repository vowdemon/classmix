import Benchmark from "benchmark";
import { createTV } from "tailwind-variants";
import { createClassmix } from "../dist/index.mjs";
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
  const base = "base-class";
  const slots = {};
  const variants = {};
  const compoundVariants = [];
  const compoundSlots = [];
  const compounds = [];
  const defaultVariants = {};

  // Add slots (if slotsCount > 1)
  if (slotsCount > 1) {
    for (let i = 1; i < slotsCount; i++) {
      slots[`slot${i}`] = `slot${i}-class`;
    }
  }

  // Add variants
  for (let i = 0; i < variantsCount; i++) {
    const variantName = `variant${i}`;
    variants[variantName] = {
      a: {},
      b: {},
    };

    // Add base variants
    variants[variantName].a.base = `${variantName}-a-base`;
    variants[variantName].b.base = `${variantName}-b-base`;

    // Add other slots variants (if any)
    if (slotsCount > 1) {
      for (let j = 1; j < slotsCount; j++) {
        const slotName = `slot${j}`;
        variants[variantName].a[slotName] = `${variantName}-a-${slotName}`;
        variants[variantName].b[slotName] = `${variantName}-b-${slotName}`;
      }
    }

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

  // Add compoundSlots to tv
  if (slotsCount > 1) {
    // Add some compoundSlots without conditions (always applied)
    compoundSlots.push({
      slots: slotNames(slotsCount, 3), // Select first 3 slots or all
      class: "flex items-center justify-center",
    });

    compounds.push({
      $share: {
        slots: slotNames(slotsCount, 3),
        class: "flex items-center justify-center",
      },
    });

    // Add some compoundSlots with conditions
    if (variantsCount > 0) {
      compoundSlots.push({
        slots: slotNames(slotsCount, 2),
        variant0: "a",
        class: "bg-blue-100 text-blue-800",
      });

      compounds.push({
        variant0: "a",
        $share: {
          slots: slotNames(slotsCount, 3),
          class: "flex items-center justify-center",
        },
      });
    }

    if (variantsCount > 1) {
      compoundSlots.push({
        slots: slotNames(slotsCount, 2),
        variant0: "a",
        variant1: "b",
        class: "rounded-full shadow-sm",
      });

      compounds.push({
        variant0: "a",
        variant1: "b",
        $share: {
          slots: slotNames(slotsCount, 3),
          class: "flex items-center justify-center",
        },
      });
    }
  }

  return {
    tv: {
      base,
      slots,
      variants,
      compoundVariants,
      compoundSlots,
      defaultVariants,
    },
    cx: {
      base,
      slots,
      variants,
      compounds: [...compoundVariants, ...compounds],
      defaultVariants,
    },
  };
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
    const longTv = tv(config.tv);
    const longCx = cx(config.cx);

    switch (scenario) {
      case "Initialization":
        suite
          .add(`tv: ${scenario}`, function () {
            tv(config.tv);
          })
          .add(`cx: ${scenario}`, function () {
            cx(config.cx);
          });
        break;
      case "Initialization with inheritance":
        suite
          .add(`tv: ${scenario}`, function () {
            tv({ extends: longTv });
          })
          .add(`cx: ${scenario}`, function () {
            cx({ extends: longCx });
          });
        break;

      case "First render":
        if (hasSlots) {
          // With slots
          suite
            .add(`tv: ${scenario}`, function () {
              const result = longTv({});
              result.base();
              if (slotNames.length > 1) result[slotNames[1]]();
            })
            .add(`cx: ${scenario}`, function () {
              const result = longCx({});
              result.base();
              if (slotNames.length > 1) result[slotNames[1]]();
            });
        } else {
          // Without slots
          suite
            .add(`tv: ${scenario}`, function () {
              const result = longTv({});
            })
            .add(`cx: ${scenario}`, function () {
              const result = longCx({});
              result.base(); // cx always uses .base()
            });
        }
        break;

      case "Repeated render": {
        if (hasSlots) {
          suite
            .add(`tv: ${scenario}`, function () {
              const result = longTv({});
              result.base();
              if (slotNames.length > 1) result[slotNames[1]]();
            })
            .add(`cx: ${scenario}`, function () {
              const result = longCx({});
              result.base();
              if (slotNames.length > 1) result[slotNames[1]]();
            });
        } else {
          suite
            .add(`tv: ${scenario}`, function () {
              const result = longTv({});
            })
            .add(`cx: ${scenario}`, function () {
              const result = longCx({});
              result.base(); // cx always uses .base()
            });
        }
        break;
      }

      case "Props change": {
        if (hasSlots) {
          let propIndex = 0;

          suite
            .add(`tv: ${scenario}`, function () {
              const props = propsVariations[propIndex % propsVariations.length];
              propIndex++;

              const result = longTv(props);
              result.base();
              if (slotNames.length > 1) result[slotNames[1]]();
            })
            .add(`cx: ${scenario}`, function () {
              const props = propsVariations[propIndex % propsVariations.length];
              propIndex++;

              const result = longCx(props);
              result.base();
              if (slotNames.length > 1) result[slotNames[1]]();
            });
        } else {
          let propIndex = 0;

          suite
            .add(`tv: ${scenario}`, function () {
              const props = propsVariations[propIndex % propsVariations.length];
              propIndex++;

              const result = longTv(props);
            })
            .add(`cx: ${scenario}`, function () {
              const props = propsVariations[propIndex % propsVariations.length];
              propIndex++;

              const result = longCx(props);
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
              // Simulate multiple renders in component lifecycle
              for (let i = 0; i < 5; i++) {
                const props = propsVariations[i % propsVariations.length];
                const result = longTv(props);

                result.base();
                // Access different slots in each render
                const slotIndex = 1 + (i % (slotNames.length - 1));
                if (slotNames.length > slotIndex) {
                  result[slotNames[slotIndex]]();
                }
              }
            })
            .add(`cx: ${scenario}`, function () {
              for (let i = 0; i < 5; i++) {
                const props = propsVariations[i % propsVariations.length];
                const result = longCx(props);

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
              for (let i = 0; i < 5; i++) {
                const props = propsVariations[i % propsVariations.length];
                const result = longTv(props);
              }
            })
            .add(`cx: ${scenario}`, function () {
              for (let i = 0; i < 5; i++) {
                const props = propsVariations[i % propsVariations.length];
                const result = longCx(props);
                result.base(); // cx always uses .base()
              }
            });
        }
        break;

      case "Compound slots render":
        if (hasSlots) {
          suite
            .add(`tv: ${scenario}`, function () {
              const result = longTv({ variant0: "a", variant1: "b" });

              // Access all slots to test compoundSlots
              for (let i = 0; i < Math.min(slotNames.length, 4); i++) {
                result[slotNames[i]]();
              }
            })
            .add(`cx: ${scenario}`, function () {
              const result = longCx({ variant0: "a", variant1: "b" });

              // Access all slots to test $share
              for (let i = 0; i < Math.min(slotNames.length, 4); i++) {
                result[slotNames[i]]();
              }
            });
        } else {
          suite
            .add(`tv: ${scenario}`, function () {
              const result = longTv({ variant0: "a", variant1: "b" });
            })
            .add(`cx: ${scenario}`, function () {
              const result = longCx({ variant0: "a", variant1: "b" });
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
