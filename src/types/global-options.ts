import Config from "./config";

type GlobalOptions = {
  config: Config;
};

export enum Platforms {
  DEVTO = "devto",
  HASHNODE = "hashnode",
  MEDIUM = "medium",
}

export default GlobalOptions;
