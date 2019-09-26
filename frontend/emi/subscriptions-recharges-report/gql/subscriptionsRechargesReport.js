import gql from "graphql-tag";

// We use the gql tag to parse our query string into a query document

export const managementReportSubscriptionRecharge = gql`
  query managementReportSubscriptionRecharge(
      $type: String,
      $timestampType: String,
      $initDate: BigInt!,
      $endDate: BigInt!){
      managementReportSubscriptionRecharge(type: $type, timestampType: $timestampType, initDate: $initDate, endDate: $endDate){
        timestampType
        timestamp
        type
        count
        amountValue
        days
        users{
          username
          count
          days
          value
        }
    }
  }
`;
