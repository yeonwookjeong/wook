export type HomeStackParamList = {
  HomeMain: undefined;
  StudySession: undefined;
};

export type QuizMode = 'day' | 'shuffle' | 'wrong';

export type TestStackParamList = {
  TestMain: undefined;
  QuizSession: { mode: QuizMode };
};

export type MyStackParamList = {
  MyMain: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  Test: undefined;
  My: undefined;
};
