const padding = (val, len = 2) => {
  let padded = '';
  for (let index = 0; index < len; index++) {
    padded += '0';
  }
  const result = `${padded}${val}`;
  return result.slice(result.length - len);
};

const dateToDays = () => {
  const date = new Date($('#mfc-date').val());
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const dayOfMonth = date.getDate();

  const days = ((year - 1980) << 9) + (month << 5) + dayOfMonth;

  $('#mfc-days').val(padding(days.toString(16).toUpperCase(), 4));
  showResult();
};

const daysToDate = () => {
  let days;
  try {
    days = parseInt($('#mfc-days').val(), 16);
    $('#mfc-days').val(padding(days.toString(16).toUpperCase(), 4));
  } catch (error) {
    console.error(error);
    init();
    return;
  }

  const year = (days >> 9) + 1980;
  const month = (days & 0x1f0) >> 5;
  const dayOfMonth = days & 0x1f;

  if (year === 0 || month === 0 || dayOfMonth === 0) {
    console.error(
      `invalid date: ${year}-${padding(month)}-${padding(dayOfMonth)}`
    );
    init();
    return;
  }

  $('#mfc-date').val(`${year}-${padding(month)}-${padding(dayOfMonth)}`);

  showResult();
};

const showResult = () => {
  let days;
  let daysByteString;
  try {
    days = parseInt($('#mfc-days').val(), 16);
    daysByteString = `${padding(
      (days & 0xff).toString(16).toUpperCase()
    )} ${padding((days >> 8).toString(16).toUpperCase())}`;
  } catch (error) {
    console.error(error);
    init();
    return;
  }

  $('#result').html(`
      <div class="col-2">S7B0</div>
      <div class="col-10">4A ${daysByteString} 00 00 00 00 00 00 00 00 00 1E 00 00 00 00 00</div>
      <div class="col-2">S8B0</div>
      <div class="col-10">4A ${daysByteString} 00 00 00 00 00 1E 00 00 00 00 00 00 00 00 00</div>
  `);
};
