export type StoryText = { en: string, zh: string }
const t = (en: string, zh: string): StoryText => ({ en, zh })
export type StoryGoal = { title: StoryText, kind: 'intel' | 'uplink' | 'override', report: StoryText }
export type StoryChapter = { brief: StoryText, intro: StoryText, goals: StoryGoal[], outcome: StoryText, next: StoryText }
export const CAMPAIGN_PREMISE = t('Black Tide has sealed Grayhaven. As a rescue operative, you land to find your missing rescue squad. A distress call leads beyond the evacuation order—and into a city-wide weapons cover-up.', '黑潮军事公司封锁了灰港。你是救援小队的行动特工，奉命寻找失联队友。撤退命令已经下达，一段求救信号却将你引向城内，揭开一场利用自动化武器销毁证据的阴谋。')
export const CAMPAIGN: StoryChapter[] = [
  {
    brief: t('Trace your squad’s distress signal through the docks. Secure the beacon and cargo records, then identify where Black Tide moved the equipment.', '沿港口追踪小队的求救信号。夺回信标与货运记录，查明黑潮正在把装备运往哪里。'),
    intro: t("Control: Raven, evacuation is ordered. Raven: I’m picking up our squad’s beacon. I’m following it inland.", '指挥部：渡鸦，立即撤离。渡鸦：检测到小队信标，必须继续追踪。'),
    goals: [
      { title: t('Recover the squad beacon', '夺回小队信标'), kind: 'intel', report: t("Raven: Squad frequency confirmed. The beacon was left beside military cargo.", '渡鸦：频率确认，是我们的小队信标。旁边堆放的全是军用物资。') },
      { title: t('Secure the cargo manifest', '夺取货运清单'), kind: 'intel', report: t("Raven: These containers carry combat drones, not relief supplies.", '渡鸦：箱里装的是武装无人机，不是救援物资。') },
      { title: t('Decode the freight destination', '解析货运目的地'), kind: 'uplink', report: t("Raven: The manifest points to the Foundry. The freight gate is our way in.", '渡鸦：货运记录指向装甲工厂，我们从货运闸门进去。') },
    ],
    outcome: t('The squad beacon and weapons manifest are secured. The freight route leads directly to the foundry.', '已夺回小队信标和武器清单，确认货运通道直达装甲工厂。'),
    next: t('Follow the shipment to the foundry and recover the full ledger.', '追查工厂内的货运总账，确认武器转运规模。'),
  },
  {
    brief: t('Seize the foundry’s production records. Open the freight lift and disable the forge executor guarding the route to the skyway.', '夺取工厂生产记录，解锁货运升降台，击破封锁高架入口的铸造执行者。'),
    intro: t("Raven: Black Tide’s serial numbers match the dock cargo. This factory is supplying the blockade.", '渡鸦：工厂里的编号与港口武器完全一致，这里就是封锁部队的供货源头。'),
    goals: [
      { title: t('Collect the production serials', '收集生产批次编号'), kind: 'intel', report: t("Raven: Every batch is assigned to civilian districts. These are attack deployments.", '渡鸦：每个批次都对应一个居民区，这不是运输，是攻击部署。') },
      { title: t('Recover the shipping ledger', '夺取货运总账'), kind: 'intel', report: t("Raven: The ledger names an operation: Iron Veil. I need an open channel to send this.", '渡鸦：总账里出现了“铁幕协议”。我要找到通讯线路，把证据传出去。') },
      { title: t('Unlock the freight lift', '解锁货运升降台'), kind: 'override', report: t("Raven: Lift access restored. The Forge Executor controls the exit. Cut its cooling and take it down.", '渡鸦：升降台权限已恢复，铸造执行者仍在封锁出口，先切断冷却，再摧毁它。') },
    ],
    outcome: t("The ledger exposes Iron Veil. With the Forge Executor disabled, the freight lift can reach the skyway relay.", '总账揭露了“铁幕协议”。铸造执行者停机后，可搭升降台前往高架中继站。'),
    next: t('Restore the skyway relay to transmit the evidence and locate the squad.', '恢复高架中继站，上传证据并定位失联小队。'),
  },
  {
    brief: t('Black Tide is jamming the city. Restore relay power, decode the squad signal, and transmit the foundry ledger.', '黑潮正在干扰全城通讯。恢复中继供电，解析小队信号，将工厂总账传出封锁区。'),
    intro: t("Raven: No uplink from the factory. The skyway relay is our only clear channel. Watch the drones.", '渡鸦：工厂通讯完全被封锁，高架中继站是唯一机会。注意上方无人机。'),
    goals: [
      { title: t('Restore relay power', '恢复中继站供电'), kind: 'override', report: t("Relay: Emergency channel restored. A squad signal is coming from the radar fortress.", '中继站：应急频道已恢复，雷达要塞方向检测到小队信号。') },
      { title: t('Decode the squad coordinates', '解析小队坐标'), kind: 'uplink', report: t("Raven: It’s a recorded distress burst. The complete message is stored at the fortress.", '渡鸦：这是被截留的求救录音，完整内容保存在雷达要塞。') },
      { title: t('Transmit the foundry ledger', '上传工厂总账'), kind: 'uplink', report: t("Control: Ledger received. Evacuation teams are mobilizing. Find out what Iron Veil targets.", '指挥部：总账已收到，撤离队正在集结。查清“铁幕协议”的攻击目标。') },
    ],
    outcome: t('The evidence reached command. The squad’s recorded signal leads to the radar fortress.', '证据已送达指挥部，小队求救录音的来源指向雷达要塞。'),
    next: t('Breach the radar fortress and recover the complete recording.', '突入雷达要塞，夺取完整求救录音。'),
  },
  {
    brief: t('Break into Black Tide’s radar outpost. Recover the squad recording and open a city route past the assault mech.', '突入黑潮雷达哨站，夺取队友录音，越过重装机甲控制的城内通道。'),
    intro: t("Raven: This outpost intercepted our squad’s calls. The recording should explain what they found.", '渡鸦：哨站截留了小队的所有呼叫，录音里应该有他们发现的真相。'),
    goals: [
      { title: t('Seize the outpost access key', '夺取哨站访问密钥'), kind: 'intel', report: t("Raven: Access key secured. Black Tide is tracking evacuation corridors.", '渡鸦：访问密钥已到手，黑潮一直在监控平民撤离走廊。') },
      { title: t('Recover the squad recording', '夺回完整队友录音'), kind: 'intel', report: t("Squad log: Iron Veil turns the city’s weapons on its evacuation routes. Stop the controller.", '小队录音：“铁幕协议”会让自动化武器攻击撤离路线。必须阻止控制核心。') },
      { title: t('Open the inner-city service gate', '打开内城维护闸门'), kind: 'override', report: t("Raven: Service gate open. The Assault Mech is the last obstacle before the city.", '渡鸦：内城维护闸门已开启，清除最后的守卫机甲就能继续前进。') },
    ],
    outcome: t("The recording reveals Iron Veil’s targets: civilian evacuation routes. The service gate now leads to the rooftops.", '录音证实“铁幕协议”针对的是平民撤离路线，维护闸门已接通内城屋顶。'),
    next: t('Cross the rooftops, disrupt targeting, and find the controller’s service tunnel.', '穿越屋顶，干扰锁定系统，寻找通往控制设施的维护隧道。'),
  },
  {
    brief: t('Advance above the city streets. Mark a safe evacuation route, interrupt Black Tide’s target feed, and unlock the service tunnel.', '绕开封锁街道，从屋顶推进。标定安全撤离路线，切断目标数据，解锁维护隧道。'),
    intro: t("Control: Evacuation teams are in position. Raven: Keep them covered. I’m going for the targeting network.", '指挥部：撤离队已经就位。渡鸦：掩护他们，我来切断敌方目标网络。'),
    goals: [
      { title: t('Mark the evacuation corridor', '标定安全撤离走廊'), kind: 'uplink', report: t("Control: Route marked. Rescue teams found our squad survivors. They’re holding in cover until the weapons go offline.", '指挥部：路线已标定，撤离队找到了小队幸存者，正在掩体后等待武器系统离线。') },
      { title: t('Interrupt the targeting feed', '切断城区目标数据流'), kind: 'override', report: t("Raven: Target feed disrupted. Local turrets still have backup control. Keep moving.", '渡鸦：目标数据流已切断，附近炮台仍有备用控制，继续推进。') },
      { title: t('Unlock the core service tunnel', '解锁核心维护隧道'), kind: 'override', report: t("Raven: Tunnel unlocked. It leads below the power complex, straight to the weapons controller.", '渡鸦：维护隧道已解锁，穿过供能区下方就能抵达武器控制核心。') },
    ],
    outcome: t('The evacuation corridor is marked and targeting disrupted. The service tunnel bypasses the final surface blockade.', '撤离路线已标定，敌方目标网络受到干扰，维护隧道可以绕过地面最后一道封锁。'),
    next: t('Enter the power complex and shut down the weapons controller.', '进入供能设施，彻底关闭自动化武器控制核心。'),
  },
  {
    brief: t('Isolate the weapons network, restore evacuation power, and arm the manual shutdown. Destroy the defense controller without damaging the reactor.', '隔离武器网络，恢复撤离通道供电，接入手动停机回路。摧毁武器控制器，保全反应堆与城区。'),
    intro: t("Raven: I’m inside. The reactor powers the city; the weapons controller is the target. Leave the reactor intact.", '渡鸦：已进入设施。反应堆负责全城供电，我们的目标是武器控制器，不能破坏反应堆。'),
    goals: [
      { title: t('Isolate the weapons uplink', '隔离自动化武器链路'), kind: 'override', report: t("Raven: External uplink isolated. The controller is fighting on its local defense circuit.", '渡鸦：对外武器链路已隔离，控制器正在启用本地防御回路。') },
      { title: t('Restore evacuation power', '恢复撤离通道供电'), kind: 'override', report: t("Control: Corridor lights are back. We’re ready to move as soon as its guns go silent.", '指挥部：撤离通道照明已恢复，只等敌方武器停机，我们就带人离开。') },
      { title: t('Arm the manual shutdown circuit', '接入手动停机回路'), kind: 'uplink', report: t("Raven: Manual shutdown armed. Destroy the defense controller to finish this.", '渡鸦：手动停机回路已接入，摧毁防御控制器，结束这场封锁。') },
    ],
    outcome: t("Iron Veil is offline. The evacuation corridor is open and command has the evidence. Raven and the surviving squad are cleared for extraction.", '“铁幕协议”已被关闭。撤离通道开放，证据已送达指挥部，渡鸦与小队幸存者获准撤离。'),
    next: t("Grayhaven operation complete · Civilian evacuation is underway.", '灰港行动完成 · 平民正在安全撤离。'),
  },
]
