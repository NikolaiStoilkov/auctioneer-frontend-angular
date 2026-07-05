export interface UserNotification {
  type: 'OUTBID' | 'NEW_BID';
  adId: number;
  adTitle: string;
  currentBidPrice: number;
  latestBidderUsername: string;
  timestamp: string;
}
