import { UpcomingBillsMobile } from "./upcoming-bills-mobile";
import { UpcomingBillsDesktop } from "./upcoming-bills-desktop";

export function UpcomingBillsWidget() {
  return (
    <>
      <UpcomingBillsMobile />
      <UpcomingBillsDesktop />
    </>
  );
}