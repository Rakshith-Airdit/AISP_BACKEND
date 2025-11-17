service BpDetails{

   entity apolloServiceSupplierOrganisation {
   key Id          : String;
    SupplierName: String;
    PhoneNumber : String;
    Address     : String;
    PostalCode  : String;
    LogoUrl     : String;
    WebSite     : String;
    CompanyId   : String;
    keyWord : String;
    limit : String;
    Location : String;

}

    entity ContactDetails{
        key Id :String;
        Name : String;
        Photo :String;
        Address : String;
        LinkdeIn : String;
        location : String;
        seniority : String;
        keyWord: String;
        limit :String;
        orgId:String;
        Email :String;
        Phone : String      
    }

    entity EnrichedContact {
        key Id : String;
        EmailId : String;
        Photo :String(500);
        Name : String
    }

    entity SendEmail {
        key Id:String;
        RecieverName:String;
        RecieverEmail:String;
    }
}