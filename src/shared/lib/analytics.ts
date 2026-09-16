type AnalyticsProperty = boolean | number | string | null;
type AnalyticsProperties = Record<string, AnalyticsProperty>;
type AnalyticsPropertyInput = Record<
  string,
  boolean | number | string | null | undefined
>;

type AnalyticsClient = {
  capture: (event: string, properties?: AnalyticsProperties) => void;
};

let analyticsClient: AnalyticsClient | null = null;

export function setAnalyticsClient(client: AnalyticsClient | null) {
  analyticsClient = client;
}

export function captureAnalyticsEvent(
  event: string,
  properties: AnalyticsPropertyInput = {},
) {
  const sanitizedProperties = Object.fromEntries(
    Object.entries(properties).filter((entry): entry is [string, AnalyticsProperty] =>
      entry[1] !== undefined,
    ),
  );

  analyticsClient?.capture(event, {
    schema_version: 1,
    ...sanitizedProperties,
  });
}
