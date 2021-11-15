import React, { useState } from 'react';
import { Link as RRDLink } from 'react-router-dom';
import { Stack, Text, Link, getTheme } from '@fluentui/react';
import Axios from 'axios';
import { format } from 'date-fns';

import { useInterval } from '../../hooks/useInterval';
import { Status, InferenceMode, DeploymentType } from '../../store/project/projectTypes';
import { DEMO_SCENARIO_IDS } from '../../constant';
import { InferenceMetrics } from './ts/Deployment';

import { getErrorLog } from '../../store/shared/createWrappedAsync';

const { palette } = getTheme();

type InsightsProps = {
  status: Status;
  projectId: number;
  cameraId: number;
  inferenceMode: InferenceMode;
  countingStartTime: string;
  countingEndTime: string;
  deploymentType: DeploymentType;
  modelId: number;
};

export const Insights: React.FC<InsightsProps> = (props) => {
  const {
    status,
    projectId,
    cameraId,
    inferenceMode,
    countingStartTime,
    countingEndTime,
    deploymentType,
    modelId,
  } = props;

  const [inferenceMetrics, setinferenceMetrics] = useState<InferenceMetrics>({
    success_rate: null,
    device: '',
    average_time: 0,
    count: null,
    inference_num: null,
    scenario_metrics: [],
    unidentified_num: null,
  });

  useInterval(
    () => {
      Axios.get(`/api/part_detections/${projectId}/export?camera_id=${cameraId}`)
        .then(({ data }) => {
          setinferenceMetrics({
            success_rate: data.success_rate,
            device: data.device,
            average_time: data.average_time,
            count: data.count,
            inference_num: data.inference_num,
            scenario_metrics: data.scenario_metrics,
            unidentified_num: data.unidentified_num,
          });
          return void 0;
        })
        .catch((e) => alert(getErrorLog(e)));
    },
    status === Status.StartInference ? 5000 : null,
  );

  return (
    <>
      <Stack
        styles={{ root: { padding: '24px 20px', borderBottom: `solid 1px ${palette.neutralLight}` } }}
        tokens={{ childrenGap: '8px' }}
      >
        <Text>
          {`Running on ${inferenceMetrics.device.toUpperCase()} (accelerated) ${
            Math.round(inferenceMetrics.average_time * 100) / 100
          } ms`}
        </Text>
        {(inferenceMetrics.device === 'vpu' || inferenceMetrics.device === 'cpu') && (
          <a
            href="https://software.intel.com/content/www/us/en/develop/tools/openvino-toolkit.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/icons/openvino_logo.png" alt="logo" style={{ width: '100px' }} />
          </a>
        )}
      </Stack>
      {deploymentType === 'model' && (
        <>
          <Stack
            styles={{ root: { padding: '24px 20px', borderBottom: `solid 1px ${palette.neutralLight}` } }}
            tokens={{ childrenGap: '8px' }}
          >
            <Text styles={{ root: { fontWeight: 'bold' } }}>Inference Matrix</Text>
            <Text>Success Rate:</Text>
            {!!inferenceMetrics.success_rate &&
              Object.keys(inferenceMetrics.success_rate).map((key) => (
                <Text key={key}> {`${key}: ${inferenceMetrics.success_rate[key]}%`} </Text>
              ))}
          </Stack>
          <Stack
            styles={{ root: { padding: '24px 20px', borderBottom: `solid 1px ${palette.neutralLight}` } }}
            tokens={{ childrenGap: '8px' }}
          >
            <Text styles={{ root: { fontWeight: 'bold' } }}>Live Analytics</Text>
            {!!inferenceMetrics.count &&
              Object.keys(inferenceMetrics.count).map((key) => (
                <Text key={key}> {`${key}: ${inferenceMetrics.count[key]}`} </Text>
              ))}
            {inferenceMetrics.scenario_metrics.length !== 0 && (
              <>
                {inferenceMetrics.scenario_metrics[0].name === 'all_objects' &&
                  Object.keys(inferenceMetrics.scenario_metrics[0].count).map((countKey) => (
                    <Text key={countKey}>
                      {`The count of line${countKey}: ${inferenceMetrics.scenario_metrics[0].count[countKey]}`}
                    </Text>
                  ))}
                {inferenceMetrics.scenario_metrics[0].name === 'violation' &&
                  Object.keys(inferenceMetrics.scenario_metrics[0].count).map((countKey) => (
                    <Text key={countKey}>
                      {`The count of zone${countKey} - Current: ${inferenceMetrics.scenario_metrics[0].count[countKey].current}, Total: ${inferenceMetrics.scenario_metrics[0].count[countKey].total}`}
                    </Text>
                  ))}
              </>
            )}
            {!DEMO_SCENARIO_IDS.includes(modelId) && (
              <RRDLink to={`/images/${modelId}`} style={{ textDecoration: 'none' }}>
                <Link styles={{ root: { textDecoration: 'none' } }}>View in images</Link>
              </RRDLink>
            )}
          </Stack>
        </>
      )}
      {inferenceMode === InferenceMode.TotalCustomerCounting &&
        countingStartTime !== '' &&
        countingEndTime !== '' && (
          <Stack
            styles={{ root: { padding: '24px 20px', borderBottom: `solid 1px ${palette.neutralLight}` } }}
            tokens={{ childrenGap: '8px' }}
          >
            <Text styles={{ root: { fontWeight: 'bold' } }}>Time</Text>
            <Stack tokens={{ childrenGap: 15 }}>
              <Text variant="mediumPlus" styles={{ root: { color: palette.neutralPrimary } }}>
                Start Time : {format(new Date(countingStartTime), 'yyyy/MM/dd H:mm')}
              </Text>
              <span>~</span>
              <Text variant="mediumPlus" styles={{ root: { color: palette.neutralPrimary } }}>
                End Time : {format(new Date(countingEndTime), 'yyyy/MM/dd H:mm')}
              </Text>
            </Stack>
          </Stack>
        )}
    </>
  );
};
