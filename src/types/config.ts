import { MediumConnectionSettings, MediumOptions } from "./clients/medium";
import {
  HashnodeConnectionSettings,
  HashnodeOptions,
} from "./clients/hashnode";
import { DevToConnectionSettings, DevToOptions } from "./clients/devto";

export type ConfigDevTo = {
  connection_settings: DevToConnectionSettings;
  options: DevToOptions;
};

export type ConfigHashnode = {
  connection_settings: HashnodeConnectionSettings;
  options: HashnodeOptions;
};

export type ConfigMedium = {
  connection_settings: MediumConnectionSettings;
  options: MediumOptions;
};

type Config = {
  devto: ConfigDevTo;
  hashnode: ConfigHashnode;
  medium: ConfigMedium;
};

export default Config;
