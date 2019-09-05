import gql from "graphql-tag";

// We use the gql tag to parse our query string into a query document

//Hello world sample, please remove
export const getHelloWorld = gql`
  query getHelloWorldFromManagementReport{
    getHelloWorldFromManagementReport{
      sn      
    }
  }
`;

export const managementReportSubscriptionRecharge = gql`
  query managementReportSubscriptionRecharge(
      $type: String,
      $timestampType: String,
      $initDate: BigInt,
      $endDate: BigInt){
      managementReportSubscriptionRecharge(type: $type, timestampType: $timestampType, initDate: $initDate, endDate: $endDate){
        timestampType
        timestamp
        count
        amountValue
        days      
    }
  }
`;


//Hello world sample, please remove
export const ManagementReportHelloWorldSubscription = gql`
  subscription{
    ManagementReportHelloWorldSubscription{
      sn
  }
}`;
