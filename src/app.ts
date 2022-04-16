import axios, { AxiosResponse } from 'axios';
import { Chart, registerables } from 'chart.js';
import { Country, CountryInfo, CovidStatus, CovidSummaryResponse } from './covid';

interface CovidElementMapper {
    '.confirmed-total': HTMLSpanElement;
    '.deaths': HTMLParagraphElement;
    '.recovered': HTMLParagraphElement;
    '.last-updated-time': HTMLParagraphElement;
    '.rank-list': HTMLOListElement;
    '.deaths-list': HTMLOListElement;
    '.recovered-list': HTMLOListElement;
    '#lineChart': HTMLCanvasElement;
}

// utils
function elementSelector<K extends keyof CovidElementMapper>(selector: K): CovidElementMapper[K] {
    return document.querySelector(selector);
}

function getUnixTimestamp(date: Date) {
    return new Date(date).getTime();
}

// DOM
const confirmedTotal = elementSelector('.confirmed-total');
const deathsTotal = elementSelector('.deaths');
const recoveredTotal = elementSelector('.recovered');
const lastUpdatedTime = elementSelector('.last-updated-time');
const rankList = elementSelector('.rank-list');
const deathsList = elementSelector('.deaths-list');
const recoveredList = elementSelector('.recovered-list');
const deathSpinner = createSpinnerElement('deaths-spinner');
const recoveredSpinner = createSpinnerElement('recovered-spinner');
let createdChart: { destroy: () => void };

function createSpinnerElement(id: string) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.setAttribute('id', id);
    wrapperDiv.setAttribute('class', 'spinner-wrapper flex justify-center align-center');
    const spinnerDiv = document.createElement('div');
    spinnerDiv.setAttribute('class', 'ripple-spinner');
    spinnerDiv.appendChild(document.createElement('div'));
    spinnerDiv.appendChild(document.createElement('div'));
    wrapperDiv.appendChild(spinnerDiv);
    return wrapperDiv;
}

// state
let isDeathLoading = false;
// const isRecoveredLoading = false;

// api
function fetchCovidSummary(): Promise<AxiosResponse<CovidSummaryResponse>> {
    const url = 'https://api.covid19api.com/summary';
    return axios.get(url);
}

function fetchCountryInfo(countryCode: string, status: CovidStatus): Promise<AxiosResponse<Array<CountryInfo>>> {
    // params: confirmed, recovered, deaths
    const url = `https://api.covid19api.com/country/${countryCode}/status/${status}`;
    return axios.get(url);
}

// methods
async function startApp() {
    await setupData();
    initEvents();
}

// events
function initEvents() {
    rankList.addEventListener('click', handleListClick);
}

async function handleListClick(event: Event) {
    let selectedId;
    if (event.target instanceof HTMLParagraphElement || event.target instanceof HTMLSpanElement) {
        selectedId = event.target.parentElement.id;
    }
    if (event.target instanceof HTMLLIElement) {
        selectedId = event.target.id;
    }
    if (isDeathLoading) {
        return;
    }
    clearDeathList();
    clearRecoveredList();
    startLoadingAnimation();
    isDeathLoading = true;
    const { data: deathResponse } = await fetchCountryInfo(selectedId, CovidStatus.DEATHS);
    const { data: recoveredResponse } = await fetchCountryInfo(selectedId, CovidStatus.RECOVERED);
    const { data: confirmedResponse } = await fetchCountryInfo(selectedId, CovidStatus.CONFIRMED);
    endLoadingAnimation();
    setDeathsList(deathResponse);
    setTotalDeathsByCountry(deathResponse);
    setRecoveredList(recoveredResponse);
    setTotalRecoveredByCountry(recoveredResponse);
    setChartData(confirmedResponse);
    isDeathLoading = false;
}

function setDeathsList(data: Array<CountryInfo>) {
    const sorted = data.sort((a: CountryInfo, b: CountryInfo) => getUnixTimestamp(b.Date) - getUnixTimestamp(a.Date));
    sorted.forEach((value: CountryInfo) => {
        const li = document.createElement('li');
        li.setAttribute('class', 'list-item-b flex align-center');
        const span = document.createElement('span');
        span.textContent = value.Cases.toString();
        span.setAttribute('class', 'deaths');
        const p = document.createElement('p');
        p.textContent = new Date(value.Date).toLocaleDateString().slice(0, -1);
        li.appendChild(span);
        li.appendChild(p);
        deathsList.appendChild(li);
    });
}

function clearDeathList() {
    deathsList.innerHTML = null;
}

function setTotalDeathsByCountry(data: Array<CountryInfo>) {
    deathsTotal.innerText = data[0].Cases.toString();
}

function setRecoveredList(data: Array<CountryInfo>) {
    const sorted = data.sort((a: CountryInfo, b: CountryInfo) => getUnixTimestamp(b.Date) - getUnixTimestamp(a.Date));
    sorted.forEach((value: CountryInfo) => {
        const li = document.createElement('li');
        li.setAttribute('class', 'list-item-b flex align-center');
        const span = document.createElement('span');
        span.textContent = value.Cases.toString();
        span.setAttribute('class', 'recovered');
        const p = document.createElement('p');
        p.textContent = new Date(value.Date).toLocaleDateString().slice(0, -1);
        li.appendChild(span);
        li.appendChild(p);
        recoveredList.appendChild(li);
    });
}

function clearRecoveredList() {
    recoveredList.innerHTML = null;
}

function setTotalRecoveredByCountry(data: Array<CountryInfo>) {
    recoveredTotal.innerText = data[0].Cases.toString();
}

function startLoadingAnimation() {
    deathsList.appendChild(deathSpinner);
    recoveredList.appendChild(recoveredSpinner);
}

function endLoadingAnimation() {
    deathsList.removeChild(deathSpinner);
    recoveredList.removeChild(recoveredSpinner);
}

async function setupData() {
    const { data } = await fetchCovidSummary();
    setTotalConfirmedNumber(data);
    setTotalDeathsByWorld(data);
    setTotalRecoveredByWorld(data);
    setCountryRanksByConfirmedCases(data);
    setLastUpdatedTimestamp(data);
}

function renderChart(data: Array<number>, labels: Array<string>) {
    const ctx = elementSelector('#lineChart').getContext('2d');
    Chart.register(...registerables);
    Chart.defaults.color = '#f5eaea';
    Chart.defaults.font.family = 'Exo 2';
    createdChart?.destroy();
    createdChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Confirmed for the last two weeks',
                    backgroundColor: '#feb72b',
                    borderColor: '#feb72b',
                    fill: true,
                    data,
                },
            ],
        },
        options: {},
    });
}

function setChartData(data: Array<CountryInfo>) {
    const chartData: number[] = data.slice(-14).map((value: CountryInfo) => value.Cases);
    const chartLabel: string[] = data
        .slice(-14)
        .map((value: CountryInfo) => new Date(value.Date).toLocaleDateString().slice(5, -1));
    renderChart(chartData, chartLabel);
}

function setTotalConfirmedNumber(data: CovidSummaryResponse) {
    confirmedTotal.innerText = data.Countries.reduce(
        (total: number, current: Country) => total + current.TotalConfirmed,
        0
    ).toString();
}

function setTotalDeathsByWorld(data: CovidSummaryResponse) {
    deathsTotal.innerText = data.Countries.reduce(
        (total: number, current: Country) => total + current.TotalDeaths,
        0
    ).toString();
}

function setTotalRecoveredByWorld(data: CovidSummaryResponse) {
    recoveredTotal.innerText = data.Countries.reduce(
        (total: number, current: Country) => total + current.TotalRecovered,
        0
    ).toString();
}

function setCountryRanksByConfirmedCases(data: CovidSummaryResponse) {
    data.Countries.sort((a: Country, b: Country) => b.TotalConfirmed - a.TotalConfirmed).forEach((value: Country) => {
        const li = document.createElement('li');
        li.setAttribute('class', 'list-item flex align-center');
        li.setAttribute('id', value.Slug);
        const span = document.createElement('span');
        span.textContent = value.TotalConfirmed.toString();
        span.setAttribute('class', 'cases');
        const p = document.createElement('p');
        p.setAttribute('class', 'country');
        p.textContent = value.Country;
        li.appendChild(span);
        li.appendChild(p);
        rankList.appendChild(li);
    });
}

function setLastUpdatedTimestamp(data: CovidSummaryResponse) {
    lastUpdatedTime.innerText = new Date(data.Date).toLocaleString();
}

startApp();
