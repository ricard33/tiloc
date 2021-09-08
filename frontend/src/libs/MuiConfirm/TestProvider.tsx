import React, { useState } from "react";
import { useTranslation } from "react-i18next";

type TestProviderProps = {
};

const TestProvider: React.FunctionComponent<TestProviderProps> = ({
  ...props
}: TestProviderProps) => {
  const [state] = useState(false);
  const { t } = useTranslation();

  return (
    <div {...props}>
      {t('My component: ')}{state}

    </div>

  );
};

export default TestProvider;
