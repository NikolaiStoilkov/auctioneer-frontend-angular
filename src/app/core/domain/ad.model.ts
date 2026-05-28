export interface LastBidder {
  id: number;
  userId: number;
  username?: string;
  amount?: number;
  timestamp?: string;
}

export interface Ad {
  id?: number;
  title: string;
  image?: string;
  description: string;
  bidStep: number;
  startingBidPrice: number;
  currentBidPrice?: number;
  authorId?: number;
  lastBidders?: LastBidder[];
  location: string;
  images?: string[];
  isActive?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'SOLD';
  startingDate?: string;
  balance?: number;
}

export interface AdFilter {
  active?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}

export interface BidRequest {
  adId: number;
  userId: number;
  amount: number;
}

export interface BidResponse {
  adId: number;
  currentBidPrice: number;
  nextMinimumBid: number;
  latestBidderUsername: string;
  timestamp: string;
}
