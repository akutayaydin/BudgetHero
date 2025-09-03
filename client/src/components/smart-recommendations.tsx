import { SmartRecommendationsMobile } from "./smart-recommendations-mobile";
import { SmartRecommendationsDesktop } from "./smart-recommendations-desktop";

export function SmartRecommendations() {
  return (
    <>
      <SmartRecommendationsMobile />
      <SmartRecommendationsDesktop />
    </>
  );
}