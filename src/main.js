import cc from "classcat";

const mergeSlots = (childSlots, parentSlots) => {
  if (!parentSlots) return childSlots;
  const result = { ...parentSlots };
  for (const slotName in childSlots) {
    const parentSlotValue = parentSlots[slotName];
    const childSlotValue = childSlots[slotName];

    if (!parentSlotValue) {
      result[slotName] = childSlotValue;
      continue;
    }

    result[slotName] = cc([parentSlotValue, childSlotValue]);
  }
  return result;
};

const mergeVariantsSlots = (childVariants, parentVariants) => {
  const result = Object.assign({}, parentVariants);

  let slotName, parentSlotValue, childSlotValue;
  for (slotName in childVariants) {
    childSlotValue = childVariants[slotName];
    parentSlotValue = parentVariants[slotName];

    if (!parentSlotValue) {
      result[slotName] = childSlotValue;
      continue;
    }

    result[slotName] = mergeSlots(childSlotValue, parentSlotValue);
  }

  return result;
};

const initVariants = (variantsConfig, parentVariants) => {
  if (!parentVariants) {
    const result = {};
    for (const variantName in variantsConfig) {
      const valuesConfig = variantsConfig[variantName];
      const currentVariant = {};
      for (const variantValue in valuesConfig) {
        const classes = valuesConfig[variantValue];
        currentVariant[variantValue] =
          typeof classes === "object" ? classes : { base: classes };
      }

      result[variantName] = currentVariant;
    }

    return result;
  }

  const result = Object.assign({}, parentVariants);

  for (const variantName in variantsConfig) {
    const valuesConfig = variantsConfig[variantName];
    const existingVariant = parentVariants[variantName];

    const currentVariant = {};
    let key, classes;

    for (key in valuesConfig) {
      classes = valuesConfig[key];

      currentVariant[key] =
        typeof classes === "object" ? classes : { base: classes };
    }

    result[variantName] =
      existingVariant !== undefined
        ? mergeVariantsSlots(currentVariant, existingVariant)
        : currentVariant;
  }

  return result;
};

const applyVariantsClass = (variants, variantsCond, slot) => {
  const result = [];

  for (const name in variants) {
    const variantConfig = variants[name];
    const variantKey = variantsCond[name];

    const variantValue =
      variantKey in variantConfig
        ? variantConfig[variantKey]
        : variantConfig["false"];

    if (variantValue === undefined) continue;

    const slotClass = variantValue?.[slot];

    if (slotClass !== undefined) result.push(slotClass);
  }

  return result;
};

const isMatch = (compoundCond, variantsCond) => {
  for (const variantName in compoundCond) {
    const conditionValues = compoundCond[variantName];
    let condValue = variantsCond[variantName];
    if (condValue === undefined) continue;
    else if (typeof condValue === "boolean" || typeof condValue === "number") {
      condValue = `${condValue}`;
    }

    if (Array.isArray(conditionValues)) {
      if (!conditionValues.includes(condValue)) {
        return false;
      }
    } else if (conditionValues !== condValue) {
      return false;
    }
  }

  return true;
};

const applySpecificSharedClass = (sharedConfig, slot, variantsCond) => {
  if (!sharedConfig.length) return undefined;

  const result = [];

  for (let i = 0; i < sharedConfig.length; i++) {
    const share = sharedConfig[i];

    if (share.slots && !share.slots.includes(slot)) {
      continue;
    }

    const classValue =
      typeof share.class === "function"
        ? share.class(variantsCond, slot)
        : share.class;

    if (classValue !== undefined) {
      result.push(classValue);
    }
  }

  return result;
};

const applyCompoundsClass = (compound, variantsCond, slot) => {
  const classValue = compound.class,
    $share = compound.$share,
    $when = compound.$when;

  const compoundsCond = {};
  for (const key in compound) {
    if (key === "class" || key === "$when" || key === "$share") continue;
    compoundsCond[key] = compound[key];
  }

  const isMatched = $when
    ? $when(variantsCond, slot)
    : isMatch(compoundsCond, variantsCond);

  if (!isMatched) return undefined;

  let specificClass = classValue[slot];
  if (typeof specificClass === "function") {
    specificClass = specificClass(variantsCond, slot);
  }

  if ($share) {
    const sharedClass = applySpecificSharedClass($share, slot, variantsCond);
    return [specificClass, sharedClass];
  }

  return specificClass;
};

const normalizeConds = (conds) => {
  for (const key in conds) {
    const value = conds[key];
    if (value === undefined) {
      conds[key] = "false";
    } else if (typeof value !== "string" && typeof value !== "object") {
      conds[key] = String(value);
    }
  }
};

const initShareConfig = (shares) => {
  if (!shares) return shares;

  const sharesArray = Array.isArray(shares) ? shares : [shares];
  const result = new Array(sharesArray.length);

  for (let i = 0; i < sharesArray.length; i++) {
    const share = sharesArray[i];
    result[i] = {
      slots: share.slots,
      class:
        typeof share.class === "function" ? share.class : cc([share.class]),
    };
  }

  return result;
};

const initCompounds = (compounds) => {
  const result = new Array(compounds.length);

  for (let i = 0; i < compounds.length; i++) {
    const compound = compounds[i];

    const classValue = compound.class;
    const $when = compound.$when;
    const $share = compound.$share;

    const compoundsCond = {};
    for (const key in compound) {
      if (key === "class" || key === "$when" || key === "$share") continue;
      compoundsCond[key] = compound[key];
    }

    normalizeConds(compoundsCond);

    result[i] = {
      $when,
      class: typeof classValue === "object" ? classValue : { base: classValue },
      $share: $share ? initShareConfig($share) : undefined,
      ...compoundsCond,
    };
  }

  return result;
};

function CLASSMIX_PROXY_FUNCTION() {}

export const createClassmix = (wrapperFn) => {
  return (config) => {
    let {
      extends: extendsConfig = {},
      base: originBase = "",
      slots: originalSlots = {},
      variants: originVariants = {},
      defaultVariants: originDefault = {},
      compounds: originCompounds = [],
    } = config;

    const variantsCondO = extendsConfig
      ? { ...extendsConfig.defaultVariants }
      : {};
    for (const key in originDefault) {
      variantsCondO[key] = originDefault[key];
    }

    const slotsConfig = {
      base: originBase,
      ...originalSlots,
    };
    const slots = extendsConfig.slots
      ? mergeSlots(slotsConfig, extendsConfig.slots)
      : slotsConfig;

    const variants = initVariants(originVariants, extendsConfig?.variants);
    const currentCompounds = initCompounds(originCompounds);

    const compounds = extendsConfig.compounds
      ? [].concat(extendsConfig.compounds, currentCompounds)
      : currentCompounds;

    const variantsFn = (configA = {}) => {
      const classAorigin = configA.class;
      const variantsCondA = {};
      for (const key in configA) {
        if (key === "class") continue;
        variantsCondA[key] = configA[key];
      }

      const classA = classAorigin;

      const slotFnCache = new Map();
      const proxy = new Proxy(CLASSMIX_PROXY_FUNCTION, {
        apply: (target, thisArg, argArray) => {
          return proxy.base.apply(thisArg, argArray);
        },
        get(target, slot) {
          if (slotFnCache.has(slot)) {
            return slotFnCache.get(slot);
          }

          const fn = (configB = {}) => {
            const classBorigin = configB.class;
            const variantsCondB = {};
            for (const key in configB) {
              if (key === "class") continue;
              variantsCondB[key] = configB[key];
            }

            const classB = classBorigin;
            const variantsCond = {
              ...variantsCondO,
              ...variantsCondA,
              ...variantsCondB,
            };

            const variantsClass = applyVariantsClass(
              variants,
              variantsCond,
              slot
            );

            const compoundsClass = compounds.map((compound) =>
              applyCompoundsClass(compound, variantsCond, slot)
            );

            const classStr = cc([
              slots[slot],
              variantsClass,
              compoundsClass,
              classA,
              classB,
            ]);
            return wrapperFn?.(classStr) ?? classStr;
          };

          slotFnCache.set(slot, fn);
          return fn;
        },
      });

      return proxy;
    };

    variantsFn.slots = slots;
    variantsFn.variants = variants;
    variantsFn.compounds = compounds;
    variantsFn.defaultVariants = variantsCondO;

    return variantsFn;
  };
};
