const isPresent = (value: unknown): boolean => value !== undefined && value !== null && value !== "";

interface ProviderParamsArgs {
  formValues: Record<string, unknown>;
  providerSpecificParams: Record<string, unknown>;
  originalParams: Record<string, unknown>;
}

const recognizedParamNames = (providerSpecificParams: Record<string, unknown>): string[] => {
  const optionalParams = providerSpecificParams.optional_params;
  const nestedFields =
    optionalParams !== null && typeof optionalParams === "object"
      ? (optionalParams as { fields?: Record<string, unknown> }).fields
      : undefined;

  return [
    ...Object.keys(providerSpecificParams).filter((paramName) => paramName !== "optional_params"),
    ...Object.keys(nestedFields ?? {}),
  ];
};

export const providerParamsForUpdate = ({
  formValues,
  providerSpecificParams,
  originalParams,
}: ProviderParamsArgs): Record<string, unknown> => {
  const optionalParams = formValues.optional_params;
  const parameters: Record<string, unknown> = {};

  for (const paramName of new Set(recognizedParamNames(providerSpecificParams))) {
    if (paramName === "patterns" || paramName === "blocked_words" || paramName === "categories") {
      continue;
    }

    const directValue = formValues[paramName];
    const paramValue =
      isPresent(directValue) || optionalParams === null || typeof optionalParams !== "object"
        ? directValue
        : (optionalParams as Record<string, unknown>)[paramName];
    const originalValue = originalParams[paramName];

    if (JSON.stringify(paramValue) === JSON.stringify(originalValue)) {
      continue;
    }

    if (isPresent(paramValue)) {
      parameters[paramName] = paramValue;
    } else if (isPresent(originalValue)) {
      parameters[paramName] = null;
    }
  }

  return parameters;
};
