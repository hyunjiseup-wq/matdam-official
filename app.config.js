// app.json 을 기본 설정으로 쓰고, 저장소에 커밋하면 안 되는 값(구글 지도 키)만
// 환경변수에서 주입한다. 키는 EAS 환경변수(GOOGLE_MAPS_API_KEY)와 로컬 .env 에 있다.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...(config.android?.config ?? {}),
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
      },
    },
  },
});
