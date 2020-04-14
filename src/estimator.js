const normalizeDuration = (type, duration) => {
  if (type === 'weeks') return duration * 7;
  if (type === 'months') return duration * 30;
  return duration; // default is days.
};
const estimateImpact = ({
  reportedCases, timeToElapse, periodType,
  totalHospitalBeds, region, fractionAffected, severity
}) => {
  const currentlyInfected = reportedCases * severity;
  const duration = normalizeDuration(periodType, timeToElapse);

  const factor = Math.trunc(duration / 3); // number of times cases will double in an elapse time.
  const infectionsByRequestedTime = currentlyInfected * (2 ** factor);

  let severeCasesByRequestedTime = fractionAffected.severeCasesByRequestedTime
        * infectionsByRequestedTime;

  const bedCapacityForCVD19 = fractionAffected.bedCapacityForCVD19 * totalHospitalBeds;
  let hospitalBedsByRequestedTime = 0;

  if (severeCasesByRequestedTime <= bedCapacityForCVD19) {
    hospitalBedsByRequestedTime = bedCapacityForCVD19;
  } else hospitalBedsByRequestedTime = bedCapacityForCVD19 - severeCasesByRequestedTime;

  let casesForICUByRequestedTime = fractionAffected.casesForICUByRequestedTime
        * infectionsByRequestedTime;

  let casesForVentilatorsByRequestedTime = fractionAffected.casesForVentilatorsByRequestedTime
        * infectionsByRequestedTime;
  const durationDollarsInFlight = normalizeDuration(periodType, timeToElapse);

  let dollarsInFlight = (infectionsByRequestedTime * region.avgDailyIncomePopulation
        * region.avgDailyIncomeInUSD) / durationDollarsInFlight;

  hospitalBedsByRequestedTime = Math.trunc(hospitalBedsByRequestedTime);
  severeCasesByRequestedTime = Math.trunc(severeCasesByRequestedTime);
  casesForICUByRequestedTime = Math.trunc(casesForICUByRequestedTime);
  casesForVentilatorsByRequestedTime = Math.trunc(casesForVentilatorsByRequestedTime);
  dollarsInFlight = Math.trunc(dollarsInFlight);

  return {
    currentlyInfected,
    infectionsByRequestedTime,
    severeCasesByRequestedTime,
    hospitalBedsByRequestedTime,
    casesForICUByRequestedTime,
    casesForVentilatorsByRequestedTime,
    dollarsInFlight
  };
};
const covid19ImpactEstimator = (data) => {
  /* fractionAffected holds percentage values , that may change
      if new information is found concerning the impact of Covid19
      this prevents a situation where these values are hardcorded into
      the estimator.
      */
  const fractionAffected = {
    severeCasesByRequestedTime: 0.15,
    bedCapacityForCVD19: 0.35,
    casesForICUByRequestedTime: 0.05,
    casesForVentilatorsByRequestedTime: 0.02
  };

  const params = { ...data, fractionAffected, severity: 10 };
  const impact = estimateImpact(params);
  params.severity = 50;
  const severeImpact = estimateImpact(params);

  return {
    data,
    impact,
    severeImpact
  };
};

export default covid19ImpactEstimator;
