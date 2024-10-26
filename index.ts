enum Intervals {
  // Query every 1 minute
  Query = 1 * 60 * 1000,
}

type IntervalStore = {
  callID: string;
  lastFetch: number | string;
};

type IntervalStoreObject = {
  [key: string]: Array<IntervalStore>;
};

let interval_list: IntervalStoreObject;

/**
 * @param {*} id
 * @returns a single call that matches the provided ID
 * checks if the call id exists in the interval-list
 */

const findCallByID = (params: {
  callId: string;
  functionId: string;
}): IntervalStore | undefined => {
  const { callId, functionId } = params;
  if (!callId || !functionId) {
    throw new Error("INTERVAL_CACHE_ERROR:CallId and functionId is required");
  }

  const intervalExists =
    interval_list !== undefined ? interval_list[callId] : [];
  if (Array.isArray(intervalExists) && intervalExists.length > 0) {
    for (const interval of intervalExists) {
      if (interval.callID === functionId) {
        return interval;
      } else {
        return;
      }
    }
    return interval_list[callId].find((r) => r.callID === functionId);
  }
};

/**
 * @param {IntervalObj} params
 * filters the call list array, removes duplicate before adding a new call object
 * checks if the call id exists in the interval-list
 */

const addCallToList = (params: {
  callid: string;
  intervalObject: IntervalStore;
}) => {
  const { callid, intervalObject } = params;

  // Check that the callid exists before performing any mutation
  const callidExists = Object.keys(interval_list || {}).some(
    (id) => id === callid
  );

  if (!callidExists) {
    interval_list = {
      ...interval_list,
      [callid]: [intervalObject],
    };
  } else {
    const currentInterval = [
      ...interval_list[callid].filter(
        (a) => a?.callID !== intervalObject.callID
      ),
      intervalObject,
    ];

    interval_list = {
      ...interval_list,
      [callid]: currentInterval,
    };
  }

  return interval_list;
};

/**
 * @param {*} params
 * checks if the call id exists in the interval-list
 */
const intervalCheck = (params: {
  callId: string;
  functionId: string;
  ttl?: number;
}): boolean => {
  const { callId, functionId, ttl } = params;

  const intervalTime = ttl ?? Intervals.Query;
  const callIDexists = findCallByID({ callId, functionId });
  const date = new Date();

  if (
    callIDexists === undefined ||
    !callIDexists.lastFetch ||
    date.getTime() - +callIDexists.lastFetch > intervalTime
  ) {
    interval_list = addCallToList({
      callid: callId,
      intervalObject: {
        lastFetch: date.getTime(),
        callID: functionId,
      },
    });

    return true;
  } else {
    return false;
  }
};

export { intervalCheck };
