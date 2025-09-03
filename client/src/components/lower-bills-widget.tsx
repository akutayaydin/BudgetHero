import { LowerBillsMobile } from "./lower-bills-mobile";
import { LowerBillsDesktop } from "./lower-bills-desktop";

export function LowerBillsWidget() {
  return (
    <>
      <LowerBillsMobile />
      <LowerBillsDesktop />
    </>
  );
}