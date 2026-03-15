import { beforeEach } from "vitest";
import { $theme } from "../../src/store/theme";

beforeEach(() => {
  $theme.set("light");
});
