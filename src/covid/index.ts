interface Country {
    Country: string;
    CountryCode: string;
    Date: string;
    NewConfirmed: number;
    NewDeaths: number;
    NewRecovered: number;
    Premium: object;
    Slug: string;
    TotalConfirmed: number;
    TotalDeaths: number;
    TotalRecovered: number;
}

interface Global {
    NewConfirmed: number;
    NewDeaths: number;
    NewRecovered: number;
    TotalConfirmed: number;
    TotalDeaths: number;
    TotalRecovered: number;
}

export enum CovidStatus {
    CONFIRMED = 'confirmed',
    RECOVERED = 'recovered',
    DEATHS = 'deaths',
}

export interface CovidSummaryResponse {
    ID: string;
    Countries: Array<Country>;
    Global: Global;
    Date: string;
    Message: string;
}

export interface CountryInfo {
    Country: string;
    CountryCode: string;
    Province: string;
    City: string;
    CityCode: string;
    Lat: string;
    Lon: string;
    Cases: number;
    Status: CovidStatus;
    Date: Date;
}
