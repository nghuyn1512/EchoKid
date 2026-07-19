export interface Recommendation {

    summary:string;

    riskLevel:"low"|"medium"|"high";

    activities:string[];

    parentTips:string[];

}