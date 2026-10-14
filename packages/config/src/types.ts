import { z } from 'zod';
import {
  AllWidgetSettingsSchema,
  AppSettingsSchema,
  LabelColorSchema,
  LauncherCommandSchema,
  MainWidgetSettingsSchema,
  ProviderSettingsSchema,
  RootConfigSchema,
  ScriptLauncherWidgetSettingsSchema,
  TemperatureLimitsSchema,
  ThemeSchema,
  ThresholdSchema,
} from './zod-types';

export type Theme = z.infer<typeof ThemeSchema>;
export type LabelColor = z.infer<typeof LabelColorSchema>;
export type Threshold = z.infer<typeof ThresholdSchema>;
export type AppSettings = z.infer<typeof AppSettingsSchema>;
export type MainWidgetSettings = z.infer<typeof MainWidgetSettingsSchema>;
export type ScriptLauncherWidgetSettings = z.infer<
  typeof ScriptLauncherWidgetSettingsSchema
>;
export type AllWidgetSettings = z.infer<typeof AllWidgetSettingsSchema>;
export type RootConfig = z.infer<typeof RootConfigSchema>;
export type ProviderSettings = z.infer<typeof ProviderSettingsSchema>;
export type TemperatureLimits = z.infer<typeof TemperatureLimitsSchema>;
export type LauncherCommand = z.infer<typeof LauncherCommandSchema>;

export type WidgetSettingsMap = {
  main: MainWidgetSettings;
  'script-launcher': ScriptLauncherWidgetSettings;
  'config-widget': Record<string, unknown>;
};
