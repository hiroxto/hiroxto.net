'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Badge, Code, List, ListItem, Stack, Text, TextInput, Title } from '@mantine/core';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';
import { calcTrainNumberType } from '@/lib/train-number-calc/train-number-calc';

const trainNumberValueSchema = z
    .string()
    .regex(/^\d+$/, '列車番号は数字のみで入力してください。')
    .refine((value) => !value.startsWith('0'), '先頭を0にすることはできません。')
    .refine((value) => {
        const parsed = Number.parseInt(value, 10);
        return parsed >= 1 && parsed <= 9999;
    }, '列車番号は1〜9999の範囲で入力してください。');

const trainNumberSchema = z.object({
    trainNumber: z.union([z.literal(''), trainNumberValueSchema]),
});

type TrainNumberFormValues = z.infer<typeof trainNumberSchema>;

export function TrainNumberCalcPage() {
    const {
        control,
        formState: { errors },
        watch,
    } = useForm<TrainNumberFormValues>({
        resolver: zodResolver(trainNumberSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            trainNumber: '',
        },
    });
    const value = watch('trainNumber');

    const trainType = useMemo(() => {
        const parseResult = trainNumberSchema.safeParse({ trainNumber: value });
        if (!parseResult.success) {
            return null;
        }
        return calcTrainNumberType(parseResult.data.trainNumber);
    }, [value]);

    return (
        <SiteSubpageFrame
            items={[{ label: 'ツール一覧', href: '/tools' }, { label: '列車番号から列車種別を計算' }]}
            title="列車番号から列車種別を計算"
            description="列車番号から列車種別(特急客, 臨急客, 臨特急客, 高速貨A, 臨専貨A, など)を計算できるページ。"
        >
            <Stack gap="xl">
                <section>
                    <Controller
                        name="trainNumber"
                        control={control}
                        render={({ field }) => (
                            <TextInput
                                {...field}
                                label="列車番号"
                                placeholder="列車番号を入力"
                                inputMode="numeric"
                                autoComplete="off"
                                error={errors.trainNumber?.message}
                            />
                        )}
                    />

                    {trainType != null ? (
                        <Badge mt="md" size="xl" color="blue" variant="filled">
                            {trainType}
                        </Badge>
                    ) : null}
                </section>

                <section>
                    <Title order={3}>列車種別の求め方</Title>

                    <Title mt="md" order={4}>
                        1. 旅客列車と貨物列車の判別
                    </Title>
                    <Text mt={6}>
                        列車番号の下2桁を見る。(e.g. <Code>1列車</Code>の場合<Code>01</Code>、<Code>2022列車</Code>
                        の場合<Code>22</Code>、<Code>5094列車</Code>の場合<Code>94</Code>。)
                    </Text>
                    <Text mt={6}>
                        <Code>00〜49</Code>なら旅客列車(2へ)、<Code>50〜99</Code>なら貨物列車(3へ)。
                    </Text>

                    <Title mt="md" order={4}>
                        2. 旅客列車の場合
                    </Title>
                    <List mt={6} listStyleType="disc" withPadding>
                        <ListItem>
                            桁数が1,2,4桁で、4桁のときの百位が<Code>0</Code>の場合、<strong>特急客</strong>。
                        </ListItem>
                        <ListItem>
                            桁数が3,4桁かつ、百位が<Code>0</Code>以外で下2桁が<Code>00〜19</Code>の場合、
                            <strong>急客</strong>
                        </ListItem>
                        <ListItem>
                            桁数が3,4桁かつ、百位が<Code>0</Code>以外で下2桁が<Code>20〜49</Code>の場合、
                            <strong>客</strong>
                        </ListItem>
                        <ListItem>
                            千位が<Code>6</Code>以上の場合は種別の頭に<Code>臨</Code>が付く。(e.g.{' '}
                            <strong>臨特急</strong>, <strong>臨急客</strong>, <strong>臨客</strong>)
                        </ListItem>
                    </List>

                    <Title mt="md" order={4}>
                        3. 貨物列車の場合
                    </Title>
                    <List mt={6} listStyleType="disc" withPadding>
                        <ListItem>
                            千位が<Code>0～5</Code>、百位が<Code>0</Code>の場合、<strong>高速貨</strong>。下2桁で
                            <strong>高速貨A</strong>と<strong>高速貨B</strong>に分かれる。
                            <List mt={6} listStyleType="disc" withPadding>
                                <ListItem>
                                    下2桁が<Code>50〜69</Code>の場合、<strong>高速貨A</strong>。
                                </ListItem>
                                <ListItem>
                                    下2桁が<Code>70〜99</Code>の場合、<strong>高速貨B</strong>。
                                </ListItem>
                            </List>
                        </ListItem>
                        <ListItem>
                            千位が<Code>0,1</Code>、百位が<Code>1〜9</Code>、下2桁が<Code>50〜59</Code>の場合、
                            <strong>高速貨C</strong>。
                        </ListItem>
                        <ListItem>
                            千位が<Code>1,3,4,5</Code>、百位が<Code>1～9</Code>の場合、<strong>専貨</strong>
                            。下2桁で
                            <strong>専貨A</strong>と<strong>専貨B</strong>に分かれる。
                            <List mt={6} listStyleType="disc" withPadding>
                                <ListItem>
                                    下2桁が<Code>60～89</Code>の場合、<strong>専貨A</strong>。
                                </ListItem>
                                <ListItem>
                                    下2桁が<Code>90～99</Code>の場合、<strong>専貨B</strong>。
                                </ListItem>
                            </List>
                        </ListItem>
                        <ListItem>
                            千位が<Code>8</Code>以上の場合は種別の頭に<Code>臨</Code>が付く。(e.g.{' '}
                            <strong>臨高速貨A</strong>, <strong>臨専貨A</strong>)
                        </ListItem>
                    </List>
                </section>
            </Stack>
        </SiteSubpageFrame>
    );
}
