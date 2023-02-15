import { useAuthContext } from '@authentication/AuthContext'
import { DEFAULT_PAGE_SIZE } from '@components/Pagination/Pagination'
import { PreviousNextGroup } from '@components/PreviousNextGroup/PreviousNextGroup'
import { useGetSessionsOpenSearchQuery } from '@graph/hooks'
import {
	Box,
	ButtonIcon,
	IconSolidChatAlt_2,
	IconSolidDocumentDuplicate,
	IconSolidExitRight,
	IconSolidLockClosed,
	IconSolidLockOpen,
	IconSolidMenuAlt_3,
	IconSolidTemplate,
	SwitchButton,
	Text,
	TextLink,
} from '@highlight-run/ui'
import { colors } from '@highlight-run/ui/src/css/colors'
import { useProjectId } from '@hooks/useProjectId'
import { usePlayerUIContext } from '@pages/Player/context/PlayerUIContext'
import { changeSession } from '@pages/Player/PlayerHook/utils'
import usePlayerConfiguration from '@pages/Player/PlayerHook/utils/usePlayerConfiguration'
import { useReplayerContext } from '@pages/Player/ReplayerContext'
import ExplanatoryPopover from '@pages/Player/Toolbar/ExplanatoryPopover/ExplanatoryPopover'
import { useSearchContext } from '@pages/Sessions/SearchContext/SearchContext'
import { defaultSessionsQuery } from '@pages/Sessions/SessionsFeedV2/components/QueryBuilder/QueryBuilder'
import analytics from '@util/analytics'
import { useParams } from '@util/react-router/useParams'
import { message } from 'antd'
import { delay } from 'lodash'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useNavigate } from 'react-router-dom'

import SessionShareButtonV2 from '../SessionShareButton/SessionShareButtonV2'
import * as styles from './SessionLevelBarV2.css'

export const SessionLevelBarV2: React.FC<
	React.PropsWithChildren & {
		width: number | string
	}
> = (props) => {
	const [copyShown, setCopyShown] = useState<boolean>(false)
	const delayRef = useRef<number>()
	const navigate = useNavigate()
	const { projectId: project_id } = useProjectId()
	const { session_secure_id } = useParams<{
		session_secure_id: string
	}>()
	const { viewport, currentUrl, sessionResults, setSessionResults, session } =
		useReplayerContext()
	const { page } = useSearchContext()
	const { isLoggedIn } = useAuthContext()
	const {
		showLeftPanel,
		setShowLeftPanel,
		showRightPanel,
		setShowRightPanel,
	} = usePlayerConfiguration()
	const { selectedRightPanelTab, setSelectedRightPanelTab } =
		usePlayerUIContext()
	const query = useMemo(() => JSON.stringify(defaultSessionsQuery), [])
	const { data } = useGetSessionsOpenSearchQuery({
		variables: {
			query,
			count: DEFAULT_PAGE_SIZE,
			page: page && page > 0 ? page : 1,
			project_id: project_id!,
			sort_desc: true,
		},
		fetchPolicy: 'cache-first',
		skip: !project_id,
	})

	const sessionIdx = sessionResults.sessions.findIndex(
		(s) => s.secure_id === session_secure_id,
	)
	const [prev, next] = [sessionIdx - 1, sessionIdx + 1]

	useEffect(() => {
		if (
			!sessionResults.sessions.length &&
			data?.sessions_opensearch.sessions.length
		) {
			setSessionResults({
				...data.sessions_opensearch,
				sessions: data.sessions_opensearch.sessions.map((s) => ({
					...s,
					payload_updated_at: new Date().toISOString(),
				})),
			})
		}
	}, [
		data?.sessions_opensearch,
		sessionResults.sessions.length,
		setSessionResults,
	])

	const canMoveForward = !!project_id && sessionResults.sessions[next]
	const canMoveBackward = !!project_id && sessionResults.sessions[prev]

	useHotkeys(
		'j',
		() => {
			if (canMoveForward && project_id) {
				analytics.track('NextSessionKeyboardShortcut')
				changeSession(
					project_id,
					navigate,
					sessionResults.sessions[next],
				)
			}
		},
		[canMoveForward, next],
	)

	useHotkeys(
		'k',
		() => {
			if (canMoveBackward && project_id) {
				analytics.track('PrevSessionKeyboardShortcut')
				changeSession(
					project_id,
					navigate,
					sessionResults.sessions[prev],
				)
			}
		},
		[canMoveBackward, prev],
	)

	return (
		<Box
			className={styles.sessionLevelBarV2}
			style={{ width: props.width }}
		>
			<Box
				p="6"
				gap="12"
				display="flex"
				width="full"
				justifyContent="space-between"
				align="center"
			>
				<Box cssClass={styles.leftButtons}>
					{isLoggedIn && !showLeftPanel && (
						<ButtonIcon
							kind="secondary"
							size="small"
							shape="square"
							emphasis="medium"
							icon={
								<IconSolidExitRight
									size={14}
									color={colors.n11}
								/>
							}
							onClick={() => setShowLeftPanel(true)}
							cssClass={styles.openLeftPanelButton}
						/>
					)}
					<PreviousNextGroup
						onPrev={() => {
							if (project_id) {
								changeSession(
									project_id,
									navigate,
									sessionResults.sessions[prev],
								)
							}
						}}
						canMoveBackward={!!canMoveBackward}
						onNext={() => {
							if (project_id) {
								changeSession(
									project_id,
									navigate,
									sessionResults.sessions[next],
								)
							}
						}}
						canMoveForward={!!canMoveForward}
					/>
					<Box
						className={styles.currentUrl}
						onMouseEnter={() => {
							if (delayRef.current) {
								window.clearTimeout(delayRef.current)
								delayRef.current = 0
							}
							setCopyShown(true)
						}}
						onMouseLeave={() => {
							delayRef.current = delay(
								() => setCopyShown(false),
								200,
							)
						}}
					>
						<TextLink
							href={currentUrl || ''}
							underline="none"
							color="none"
						>
							{currentUrl}
						</TextLink>
					</Box>
					{currentUrl && (
						<Box
							cursor="pointer"
							paddingLeft="8"
							display="flex"
							align="center"
							onMouseEnter={() => {
								if (delayRef.current) {
									window.clearTimeout(delayRef.current)
									delayRef.current = 0
								}
								setCopyShown(true)
							}}
							onMouseLeave={() => {
								delayRef.current = delay(
									() => setCopyShown(false),
									200,
								)
							}}
							onClick={() => {
								if (currentUrl?.length) {
									navigator.clipboard.writeText(currentUrl)
									message.success('Copied url to clipboard')
								}
							}}
						>
							<IconSolidDocumentDuplicate
								color={colors.n9}
								style={{
									opacity: copyShown ? 1 : 0,
									transition: 'opacity 0.1s ease-in-out',
								}}
							/>
						</Box>
					)}
				</Box>
				<Box className={styles.rightButtons}>
					{session && (
						<>
							<Box display="flex" align="center" gap="2">
								<ExplanatoryPopover
									content={
										<Text
											size="medium"
											color="n11"
											userSelect="none"
										>
											Application viewport size (pixels)
										</Text>
									}
								>
									<IconSolidTemplate color={colors.n9} />
									<Text
										size="medium"
										color="n11"
										userSelect="none"
									>
										{viewport?.width} x {viewport?.height}
									</Text>
								</ExplanatoryPopover>
							</Box>
							<Box display="flex" align="center" gap="2">
								<ExplanatoryPopover
									content={
										<Text
											size="medium"
											color="n11"
											userSelect="none"
										>
											Recording strict privacy{' '}
											{session?.enable_strict_privacy
												? 'on'
												: 'off'}
										</Text>
									}
								>
									{session?.enable_strict_privacy ? (
										<IconSolidLockClosed
											color={colors.n9}
										/>
									) : (
										<IconSolidLockOpen color={colors.n9} />
									)}
								</ExplanatoryPopover>
							</Box>
							<Box display="flex" align="center" gap="6">
								<SessionShareButtonV2 />
								<ExplanatoryPopover
									content={
										<>
											<Text userSelect="none" color="n11">
												Comments
											</Text>
										</>
									}
								>
									<SwitchButton
										size="small"
										onChange={() => {
											if (
												selectedRightPanelTab !==
												'Threads'
											) {
												setSelectedRightPanelTab(
													'Threads',
												)
											}
											setShowRightPanel(
												!showRightPanel ||
													selectedRightPanelTab !==
														'Threads',
											)
										}}
										checked={
											showRightPanel &&
											selectedRightPanelTab === 'Threads'
										}
										iconLeft={
											<IconSolidChatAlt_2 size={14} />
										}
									/>
								</ExplanatoryPopover>
								<ButtonIcon
									kind="secondary"
									size="small"
									shape="square"
									emphasis={showRightPanel ? 'high' : 'low'}
									cssClass={
										showRightPanel
											? styles.rightPanelButtonShown
											: styles.rightPanelButtonHidden
									}
									icon={<IconSolidMenuAlt_3 />}
									onClick={() => {
										setShowRightPanel(!showRightPanel)
									}}
								/>
							</Box>
						</>
					)}
				</Box>
			</Box>
		</Box>
	)
}

export default SessionLevelBarV2