import { useState, useEffect } from 'react'
import {
  Tldraw,
  useValue,
  getIndexAbove,
  IndexKey,
  ShapeUtil,
  SVGContainer,
  Rectangle2d,
  TLBaseShape,
} from 'tldraw'
import 'tldraw/tldraw.css'

// --- Custom Lens Shape Definition ---
const LENS_SHAPE_TYPE = 'optics-lens' as const

declare module 'tldraw' {
  interface TLGlobalShapePropsMap {
    'optics-lens': {
      w: number
      h: number
      focalLength: number
      lensType: 'double-convex' | 'double-concave' | 'plano-convex' | 'plano-concave'
    }
    'optics-mirror': {
      w: number
      h: number
      focalLength?: number
      mirrorType: 'flat' | 'curved'
    }
  }
}

export type OpticsLensShape = TLBaseShape<'optics-lens', {
  w: number
  h: number
  focalLength: number
  lensType: 'double-convex' | 'double-concave' | 'plano-convex' | 'plano-concave'
}>

export class OpticsLensUtil extends ShapeUtil<OpticsLensShape> {
  static override type = LENS_SHAPE_TYPE

  override canBind = () => false
  override canEdit = () => false
  override canResize = () => false

  override getDefaultProps(): OpticsLensShape['props'] {
    return {
      w: 40,
      h: 160,
      focalLength: 150,
      lensType: 'double-convex',
    }
  }

  override getGeometry(shape: OpticsLensShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  override component(shape: OpticsLensShape) {
    const { w, h, lensType, focalLength } = shape.props

    let pathD = ''
    if (lensType === 'double-convex') {
      let offset = (150 / focalLength) * (w / 2)
      if (offset < -w * 0.9) offset = -w * 0.9
      let edge = 16 // トップとボトムの幅
      let capH = 20 // トップとボトムの丸みの深さ
      pathD = `M ${w / 2 - edge} ${capH} Q ${w / 2} 0 ${w / 2 + edge} ${capH} Q ${w / 2 + offset} ${h / 2} ${w / 2 + edge} ${h - capH} Q ${w / 2} ${h} ${w / 2 - edge} ${h - capH} Q ${w / 2 - offset} ${h / 2} ${w / 2 - edge} ${capH} Z`
    } else if (lensType === 'double-concave') {
      let inward = -(150 / focalLength) * (w / 3)
      if (inward > w * 0.45) inward = w * 0.45
      let capH = 15
      pathD = `M 0 ${capH} Q ${w / 2} 0 ${w} ${capH} Q ${w - inward} ${h / 2} ${w} ${h - capH} Q ${w / 2} ${h} 0 ${h - capH} Q ${inward} ${h / 2} 0 ${capH} Z`
    } else if (lensType === 'plano-convex') {
      let offset = (300 / focalLength) * (w * 0.8)
      if (offset < -w * 0.8) offset = -w * 0.8
      let rightEdge = w * 0.2 + 25
      let capH = 20
      pathD = `M ${w * 0.2} ${capH} Q ${w * 0.2 + 10} 0 ${rightEdge} ${capH} Q ${w * 0.2 + offset} ${h / 2} ${rightEdge} ${h - capH} Q ${w * 0.2 + 10} ${h} ${w * 0.2} ${h - capH} Z`
    } else if (lensType === 'plano-concave') {
      let inward = -(300 / focalLength) * (w / 3)
      if (inward > w * 0.7) inward = w * 0.7
      let capH = 15
      pathD = `M ${w * 0.2} ${capH} Q ${w * 0.6} 0 ${w} ${capH} Q ${w - inward} ${h / 2} ${w} ${h - capH} Q ${w * 0.6} ${h} ${w * 0.2} ${h - capH} Z`
    }

    return (
      <SVGContainer id={shape.id} style={{ pointerEvents: 'all' }}>
        <svg style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <linearGradient id={`glass-${shape.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.7)" />
              <stop offset="15%" stopColor="rgba(147, 197, 253, 0.3)" />
              <stop offset="85%" stopColor="rgba(59, 130, 246, 0.15)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.5)" />
            </linearGradient>
            <linearGradient id={`highlight-${shape.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
              <stop offset="20%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>

          {/* ガラス本体 */}
          <path
            d={pathD}
            fill={`url(#glass-${shape.id})`}
            stroke="#3b82f6"
            strokeWidth={1.5}
            style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' }}
          />
          
          {/* 上部のハイライト（立体感） */}
          <path
            d={pathD}
            fill={`url(#highlight-${shape.id})`}
            pointerEvents="none"
          />

          {/* 物理的な中心線（破線） */}
          <line x1={w / 2} y1={-10} x2={w / 2} y2={h + 10} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4,4" />
        </svg>
      </SVGContainer>
    )
  }

  override indicator(shape: OpticsLensShape) {
    return <rect width={shape.props.w} height={shape.props.h} fill="none" stroke="#2563eb" strokeWidth={1.5} />
  }
}

// --- Custom Mirror Shape Definition ---
const MIRROR_SHAPE_TYPE = 'optics-mirror' as const

export type OpticsMirrorShape = TLBaseShape<'optics-mirror', {
  w: number
  h: number
  mirrorType: 'flat' | 'curved'
  focalLength?: number
}>

export class OpticsMirrorUtil extends ShapeUtil<OpticsMirrorShape> {
  static override type = MIRROR_SHAPE_TYPE

  override canBind = () => false
  override canEdit = () => false
  override canResize = () => false

  override getDefaultProps(): OpticsMirrorShape['props'] {
    return {
      w: 20,
      h: 160,
      mirrorType: 'flat',
    }
  }

  override getGeometry(shape: OpticsMirrorShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  override component(shape: OpticsMirrorShape) {
    const { w, h, mirrorType, focalLength } = shape.props

    let pathD = ''
    if (mirrorType === 'flat') {
      pathD = `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`
    } else {
      const f = focalLength || 150
      let offset = -(150 / f) * w
      if (offset < -w * 3) offset = -w * 3
      if (offset > w * 3) offset = w * 3
      pathD = `M ${w} 0 Q ${w + offset} ${h / 2} ${w} ${h}`
    }

    return (
      <SVGContainer id={shape.id} style={{ pointerEvents: 'all' }}>
        <svg style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {mirrorType === 'flat' ? (
            <g>
              <path d={pathD} fill="#e2e8f0" stroke="#64748b" strokeWidth={2} />
              <line x1={0} y1={0} x2={0} y2={h} stroke="#475569" strokeWidth={3} />
            </g>
          ) : (
            <g>
              <path d={pathD} fill="none" stroke="#64748b" strokeWidth={4} strokeLinecap="round" />
              <path d={pathD} fill="none" stroke="#475569" strokeWidth={4} strokeDasharray="3,3" />
            </g>
          )}
        </svg>
      </SVGContainer>
    )
  }

  override indicator(shape: OpticsMirrorShape) {
    return <rect width={shape.props.w} height={shape.props.h} fill="none" stroke="#64748b" strokeWidth={1.5} />
  }
}

// --- Optics Splitter Shape ---
export type OpticsSplitterShape = TLBaseShape<'optics-splitter', {
  w: number
  h: number
}>

export class OpticsSplitterUtil extends ShapeUtil<OpticsSplitterShape> {
  static override type = 'optics-splitter' as const
  override isAspectRatioLocked = () => false
  override canEdit = () => false
  override canResize = () => false

  override getDefaultProps(): OpticsSplitterShape['props'] {
    return {
      w: 20,
      h: 160,
    }
  }

  override getGeometry(shape: OpticsSplitterShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  override component(shape: OpticsSplitterShape) {
    const { w, h } = shape.props

    return (
      <SVGContainer id={shape.id} style={{ pointerEvents: 'all' }}>
        <svg style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <rect width={w} height={h} fill="rgba(6, 182, 212, 0.1)" stroke="#06b6d4" strokeWidth={2} />
          {/* 反射面（中央） */}
          <line x1={w / 2} y1={0} x2={w / 2} y2={h} stroke="#0891b2" strokeWidth={2} strokeDasharray="4,4" />
        </svg>
      </SVGContainer>
    )
  }

  override indicator(shape: OpticsSplitterShape) {
    return <rect width={shape.props.w} height={shape.props.h} fill="none" stroke="#0891b2" strokeWidth={1.5} />
  }
}

// --- Optics Cube Splitter Shape ---
export type OpticsCubeSplitterShape = TLBaseShape<'optics-cube-splitter', {
  w: number
  h: number
}>

export class OpticsCubeSplitterUtil extends ShapeUtil<OpticsCubeSplitterShape> {
  static override type = 'optics-cube-splitter' as const
  override isAspectRatioLocked = () => false
  override canEdit = () => false
  override canResize = () => false

  override getDefaultProps(): OpticsCubeSplitterShape['props'] {
    return {
      w: 80,
      h: 80,
    }
  }

  override getGeometry(shape: OpticsCubeSplitterShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  override component(shape: OpticsCubeSplitterShape) {
    const { w, h } = shape.props

    return (
      <SVGContainer id={shape.id} style={{ pointerEvents: 'all' }}>
        <svg style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {/* キューブの外枠と背景 */}
          <rect width={w} height={h} fill="rgba(6, 182, 212, 0.1)" stroke="#06b6d4" strokeWidth={2} />
          
          {/* 対角線（スプリッター面: 左下から右上） */}
          <line x1={0} y1={h} x2={w} y2={0} stroke="#0891b2" strokeWidth={2} strokeDasharray="4,4" />
          
          {/* プリズム感のある補助線 */}
          <polygon points={`0,0 ${w},0 0,${h}`} fill="rgba(255, 255, 255, 0.2)" />
        </svg>
      </SVGContainer>
    )
  }

  override indicator(shape: OpticsCubeSplitterShape) {
    return <rect width={shape.props.w} height={shape.props.h} fill="none" stroke="#0891b2" strokeWidth={1.5} />
  }
}

const customShapeUtils = [OpticsLensUtil, OpticsMirrorUtil, OpticsSplitterUtil, OpticsCubeSplitterUtil]

function CustomUI({ editor }: { editor: any }) {
  const selectedShapes = useValue('selected shapes', () => editor.getSelectedShapes(), [editor])
  const selectedShape = selectedShapes.length === 1 ? selectedShapes[0] : null

  let currentAngle = 0
  if (selectedShape) {
    if (selectedShape.type === 'arrow') {
      const start = selectedShape.props.start || { x: 0, y: 0 }
      const end = selectedShape.props.end || { x: 100, y: 0 }
      currentAngle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI
    } else {
      currentAngle = (selectedShape.rotation || 0) * 180 / Math.PI
    }
    currentAngle = Math.round(currentAngle * 10) / 10
  }

  const handleWavelengthChange = (wl: number) => {
    if (!selectedShape) return

    editor.updateShape({
      id: selectedShape.id,
      type: selectedShape.type,
      meta: { ...selectedShape.meta, wavelength: wl }
    } as any)
  }

  const [isOpen, setIsOpen] = useState(false)
  const [isHorizontal, setIsHorizontal] = useState(true)
  const [pos, setPos] = useState({ x: 20, y: typeof window !== 'undefined' ? window.innerHeight / 2 - 30 : 300 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const [sliderPos, setSliderPos] = useState({ x: typeof window !== 'undefined' ? window.innerWidth / 2 - 180 : 200, y: 20 })
  const [isSliderDragging, setIsSliderDragging] = useState(false)
  const [sliderDragOffset, setSliderDragOffset] = useState({ x: 0, y: 0 })

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    })
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    setPos({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return
    setIsDragging(false)
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }

  const handleSliderPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setIsSliderDragging(true)
    setSliderDragOffset({
      x: e.clientX - sliderPos.x,
      y: e.clientY - sliderPos.y
    })
  }

  const handleSliderPointerMove = (e: React.PointerEvent) => {
    if (!isSliderDragging) return
    setSliderPos({
      x: e.clientX - sliderDragOffset.x,
      y: e.clientY - sliderDragOffset.y
    })
  }

  const handleSliderPointerUp = (e: React.PointerEvent) => {
    if (!isSliderDragging) return
    setIsSliderDragging(false)
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }

  // 光源を追加するマクロ
  const addLaser = () => {
    const center = editor.getViewportPageBounds().center
    editor.createShape({
      type: 'geo',
      x: center.x - 20,
      y: center.y - 10,
      rotation: 0,
      props: {
        geo: 'rectangle',
        w: 120,
        h: 75,
        color: 'black',
        fill: 'solid',
      },
      meta: {
        isOpticsLaser: true,
        wavelength: 532
      }
    })
  }

  // 平行光源を追加するマクロ
  const addParallelLaser = () => {
    const center = editor.getViewportPageBounds().center
    editor.createShape({
      type: 'geo',
      x: center.x - 20,
      y: center.y - 10,
      rotation: 0,
      props: {
        geo: 'rectangle',
        w: 120,
        h: 75,
        color: 'black',
        fill: 'solid',
      },
      meta: {
        isOpticsLaser: true,
        wavelength: 532,
        rayCount: 5,
        beamWidth: 60
      }
    })
  }

  // 各種レンズを追加するマクロ
  const addDoubleConvex = () => {
    const center = editor.getViewportPageBounds().center
    editor.createShape({
      type: 'optics-lens',
      x: center.x - 20,
      y: center.y - 80,
      props: {
        w: 40,
        h: 160,
        focalLength: 150,
        lensType: 'double-convex',
      },
    })
  }

  const addDoubleConcave = () => {
    const center = editor.getViewportPageBounds().center
    editor.createShape({
      type: 'optics-lens',
      x: center.x - 20,
      y: center.y - 80,
      props: {
        w: 40,
        h: 160,
        focalLength: -150,
        lensType: 'double-concave',
      },
    })
  }

  const addPlanoConvex = () => {
    const center = editor.getViewportPageBounds().center
    editor.createShape({
      type: 'optics-lens',
      x: center.x - 15,
      y: center.y - 80,
      props: {
        w: 30,
        h: 160,
        focalLength: 300,
        lensType: 'plano-convex',
      },
    })
  }

  const addPlanoConcave = () => {
    const center = editor.getViewportPageBounds().center
    editor.createShape({
      type: 'optics-lens',
      x: center.x - 15,
      y: center.y - 80,
      props: {
        w: 30,
        h: 160,
        focalLength: -300,
        lensType: 'plano-concave',
      },
    })
  }

  // 鏡を追加するマクロ
  const addBeamSplitter = () => {
    const center = editor.getViewportPageBounds().center
    editor.createShape({
      type: 'optics-splitter',
      x: center.x - 10,
      y: center.y - 80,
      props: {
        w: 20,
        h: 160,
      },
    })
  }

  const addCubeSplitter = () => {
    const center = editor.getViewportPageBounds().center
    editor.createShape({
      type: 'optics-cube-splitter',
      x: center.x - 40,
      y: center.y - 40,
      props: {
        w: 80,
        h: 80,
      },
    })
  }

  const addFlatMirror = () => {
    const center = editor.getViewportPageBounds().center
    editor.createShape({
      type: 'optics-mirror',
      x: center.x - 10,
      y: center.y - 80,
      props: {
        w: 20,
        h: 160,
        mirrorType: 'flat',
      },
    })
  }

  const addConcaveMirror = () => {
    const center = editor.getViewportPageBounds().center
    editor.createShape({
      type: 'optics-mirror',
      x: center.x - 20,
      y: center.y - 80,
      props: {
        w: 20,
        h: 160,
        focalLength: 150,
        mirrorType: 'curved',
      },
    })
  }

  const addConvexMirror = () => {
    const center = editor.getViewportPageBounds().center
    editor.createShape({
      type: 'optics-mirror',
      x: center.x - 20,
      y: center.y - 80,
      props: {
        w: 20,
        h: 160,
        focalLength: -150,
        mirrorType: 'curved',
      },
    })
  }

  // ボタンのデザイン設定
  const btnStyle = {
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    color: 'white',
    border: 'none', 
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
    width: 'auto'
  }

  return (
    <>
      <div 
        style={{ 
          position: 'absolute', 
          top: pos.y, 
          left: pos.x, 
          zIndex: 1000, 
          background: 'rgba(255,255,255,0.95)', 
          padding: 12, 
          borderRadius: 12, 
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isOpen ? '12px' : '0' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
            🛠 光学素子メニュー
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isOpen && (
              <button 
                style={{ cursor: 'pointer', background: '#e2e8f0', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' }}
                onClick={(e) => { e.stopPropagation(); setIsHorizontal(!isHorizontal) }}
              >
                {isHorizontal ? '⬇ 縦' : '➡ 横'}
              </button>
            )}
            <button 
              style={{ cursor: 'pointer', background: '#e2e8f0', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' }}
              onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
            >
              {isOpen ? '閉じる' : '開く'}
            </button>
          </div>
        </div>

        {isOpen && (
          <div style={{ display: 'flex', gap: '16px', alignItems: isHorizontal ? 'flex-start' : 'stretch', flexDirection: isHorizontal ? 'row' : 'column' }}>
            <div style={{ display: 'flex', gap: '8px', flexDirection: isHorizontal ? 'row' : 'column' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', alignSelf: isHorizontal ? 'center' : 'flex-start', color: '#475569', marginRight: isHorizontal ? '4px' : '0', marginBottom: isHorizontal ? '0' : '4px' }}>光源:</span>
              <button style={{ ...btnStyle, backgroundColor: '#10b981', width: isHorizontal ? 'auto' : '100%' }} onClick={addLaser}>レーザー</button>
              <button style={{ ...btnStyle, backgroundColor: '#059669', width: isHorizontal ? 'auto' : '100%' }} onClick={addParallelLaser}>平行光源</button>
            </div>
            {isHorizontal && <div style={{ width: '1px', background: '#cbd5e1', alignSelf: 'stretch' }} />}
            <div style={{ display: 'flex', gap: '8px', flexDirection: isHorizontal ? 'row' : 'column' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', alignSelf: isHorizontal ? 'center' : 'flex-start', color: '#475569', marginRight: isHorizontal ? '4px' : '0', marginBottom: isHorizontal ? '0' : '4px' }}>レンズ:</span>
              <button style={{ ...btnStyle, backgroundColor: '#2563eb', width: isHorizontal ? 'auto' : '100%' }} onClick={addDoubleConvex}>両凸</button>
              <button style={{ ...btnStyle, backgroundColor: '#1d4ed8', width: isHorizontal ? 'auto' : '100%' }} onClick={addDoubleConcave}>両凹</button>
              <button style={{ ...btnStyle, backgroundColor: '#3b82f6', width: isHorizontal ? 'auto' : '100%' }} onClick={addPlanoConvex}>平凸</button>
              <button style={{ ...btnStyle, backgroundColor: '#60a5fa', width: isHorizontal ? 'auto' : '100%' }} onClick={addPlanoConcave}>平凹</button>
            </div>
            
            <div style={{ width: isHorizontal ? '1px' : '100%', height: isHorizontal ? '24px' : '1px', background: '#cbd5e1' }}></div>
            
            <div style={{ display: 'flex', gap: '8px', flexDirection: isHorizontal ? 'row' : 'column' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', alignSelf: isHorizontal ? 'center' : 'flex-start', color: '#475569', marginRight: isHorizontal ? '4px' : '0', marginBottom: isHorizontal ? '0' : '4px' }}>鏡:</span>
              <button style={{ ...btnStyle, backgroundColor: '#0891b2', width: isHorizontal ? 'auto' : '100%' }} onClick={addBeamSplitter}>板スプリッター</button>
              <button style={{ ...btnStyle, backgroundColor: '#0e7490', width: isHorizontal ? 'auto' : '100%' }} onClick={addCubeSplitter}>キューブ</button>
              <button style={{ ...btnStyle, backgroundColor: '#64748b', width: isHorizontal ? 'auto' : '100%' }} onClick={addFlatMirror}>平面</button>
              <button style={{ ...btnStyle, backgroundColor: '#475569', width: isHorizontal ? 'auto' : '100%' }} onClick={addConcaveMirror}>凹面</button>
              <button style={{ ...btnStyle, backgroundColor: '#334155', width: isHorizontal ? 'auto' : '100%' }} onClick={addConvexMirror}>凸面</button>
            </div>
          </div>
        )}
      </div>

      {selectedShape && (
        <div 
          style={{ 
            position: 'absolute', 
            top: sliderPos.y, 
            left: sliderPos.x, 
            zIndex: 1000, 
            background: 'rgba(255,255,255,0.95)', 
            padding: '12px 24px', 
            borderRadius: 12, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)', 
            display: 'flex', 
            flexDirection: 'column',
            gap: '12px',
            cursor: isSliderDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            userSelect: 'none'
          }}
          onPointerDown={handleSliderPointerDown}
          onPointerMove={handleSliderPointerMove}
          onPointerUp={handleSliderPointerUp}
          onPointerCancel={handleSliderPointerUp}
        >
          <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#333', textAlign: 'center', marginBottom: '4px' }}>
            詳細プロパティ
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ fontSize: '13px', color: '#333' }}>X: 
              <input 
                type="number" 
                value={Math.round(selectedShape.x)} 
                onChange={(e) => editor.updateShape({ id: selectedShape.id, type: selectedShape.type, x: Number(e.target.value) } as any)}
                style={{ width: '60px', marginLeft: '4px' }}
              />
            </label>
            <label style={{ fontSize: '13px', color: '#333' }}>Y: 
              <input 
                type="number" 
                value={Math.round(selectedShape.y)} 
                onChange={(e) => editor.updateShape({ id: selectedShape.id, type: selectedShape.type, y: Number(e.target.value) } as any)}
                style={{ width: '60px', marginLeft: '4px' }}
              />
            </label>
            <label style={{ fontSize: '13px', color: '#333' }}>角度(度): 
              <input 
                type="number" 
                value={currentAngle} 
                onChange={(e) => {
                  const newAngleDeg = Number(e.target.value)
                  const newAngleRad = newAngleDeg * Math.PI / 180
                  if (selectedShape.type === 'arrow') {
                    const start = selectedShape.props.start || { x: 0, y: 0 }
                    const end = selectedShape.props.end || { x: 100, y: 0 }
                    const len = Math.sqrt((end.x - start.x)**2 + (end.y - start.y)**2) || 100
                    editor.updateShape({
                      id: selectedShape.id,
                      type: selectedShape.type,
                      props: {
                        end: {
                          x: start.x + len * Math.cos(newAngleRad),
                          y: start.y + len * Math.sin(newAngleRad)
                        }
                      }
                    } as any)
                  } else {
                    editor.updateShape({
                      id: selectedShape.id,
                      type: selectedShape.type,
                      rotation: newAngleRad
                    } as any)
                  }
                }}
                style={{ width: '60px', marginLeft: '4px' }}
              />
            </label>
          </div>

          {selectedShape.meta?.isOpticsLaser && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#333', minWidth: '65px' }}>
                  波長 (nm):
                </label>
                <input
                  type="number"
                  value={selectedShape.meta.wavelength ?? 532}
                  onChange={(e) => handleWavelengthChange(Number(e.target.value))}
                  style={{ width: '60px' }}
                />
                <input
                  type="range"
                  min={400}
                  max={700}
                  step={1}
                  value={selectedShape.meta.wavelength ?? 532}
                  onChange={(e) => handleWavelengthChange(Number(e.target.value))}
                  style={{ width: '100px', cursor: 'pointer' }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap', paddingLeft: '77px' }}>
                <button style={{ ...btnStyle, padding: '2px 8px', fontSize: '11px', backgroundColor: '#8b5cf6', width: 'auto' }} onClick={() => handleWavelengthChange(405)}>405nm</button>
                <button style={{ ...btnStyle, padding: '2px 8px', fontSize: '11px', backgroundColor: '#3b82f6', width: 'auto' }} onClick={() => handleWavelengthChange(450)}>450nm</button>
                <button style={{ ...btnStyle, padding: '2px 8px', fontSize: '11px', backgroundColor: '#22c55e', width: 'auto' }} onClick={() => handleWavelengthChange(532)}>532nm</button>
                <button style={{ ...btnStyle, padding: '2px 8px', fontSize: '11px', backgroundColor: '#ef4444', width: 'auto' }} onClick={() => handleWavelengthChange(650)}>650nm</button>
              </div>

              {selectedShape.meta.rayCount !== undefined && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#333', minWidth: '65px' }}>
                      光線の数:
                    </label>
                    <input
                      type="number"
                      value={selectedShape.meta.rayCount ?? 5}
                      onChange={(e) => editor.updateShape({ id: selectedShape.id, type: selectedShape.type, meta: { ...selectedShape.meta, rayCount: Number(e.target.value) } } as any)}
                      style={{ width: '60px' }}
                    />
                    <input
                      type="range"
                      min={2} max={21} step={1}
                      value={selectedShape.meta.rayCount ?? 5}
                      onChange={(e) => editor.updateShape({ id: selectedShape.id, type: selectedShape.type, meta: { ...selectedShape.meta, rayCount: Number(e.target.value) } } as any)}
                      style={{ width: '100px', cursor: 'pointer' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#333', minWidth: '65px' }}>
                      ビーム幅:
                    </label>
                    <input
                      type="number"
                      value={selectedShape.meta.beamWidth ?? 40}
                      onChange={(e) => editor.updateShape({ id: selectedShape.id, type: selectedShape.type, meta: { ...selectedShape.meta, beamWidth: Number(e.target.value) } } as any)}
                      style={{ width: '60px' }}
                    />
                    <input
                      type="range"
                      min={10} max={200} step={5}
                      value={selectedShape.meta.beamWidth ?? 40}
                      onChange={(e) => editor.updateShape({ id: selectedShape.id, type: selectedShape.type, meta: { ...selectedShape.meta, beamWidth: Number(e.target.value) } } as any)}
                      style={{ width: '100px', cursor: 'pointer' }}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {(selectedShape.type === 'optics-lens' || (selectedShape.type === 'optics-mirror' && selectedShape.props.mirrorType === 'curved')) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#333', minWidth: '65px' }}>
                焦点距離:
              </label>
              <input
                type="number"
                value={selectedShape.props.focalLength || 150}
                onChange={(e) => {
                  let val = Number(e.target.value)
                  if (val === 0) val = 10 
                  editor.updateShape({
                    id: selectedShape.id,
                    type: selectedShape.type,
                    props: { focalLength: val }
                  } as any)
                }}
                style={{ width: '60px' }}
              />
              <input
                type="range"
                min={-500}
                max={500}
                step={10}
                value={selectedShape.props.focalLength || 150}
                onChange={(e) => {
                  let val = Number(e.target.value)
                  if (val === 0) val = 10 
                  editor.updateShape({
                    id: selectedShape.id,
                    type: selectedShape.type,
                    props: { focalLength: val }
                  } as any)
                }}
                style={{ width: '100px', cursor: 'pointer' }}
              />
            </div>
          )}
        </div>
      )}
    </>
  )
}

// --- Main App Component ---
export default function App() {
  const [editor, setEditor] = useState<any>(null)

  useEffect(() => {
    if (!editor) return

    const updateRays = () => {
      const shapes = editor.getCurrentPageShapes()
      const lasers = shapes.filter((s: any) => (s.type === 'geo' || s.type === 'arrow') && (s.meta?.isOpticsLaser || s.meta?.wavelength))
      const lenses = shapes.filter((s: any) => s.type === 'optics-lens')
      const mirrors = shapes.filter((s: any) => s.type === 'optics-mirror')
      const splitters = shapes.filter((s: any) => s.type === 'optics-splitter')
      const cubeSplitters = shapes.filter((s: any) => s.type === 'optics-cube-splitter')

      // まずキャンバス上の全ての既存光線を一掃する（ロックされていると削除できないためロックを解除してから削除）
      const existingRays = shapes.filter((s: any) => s.id.startsWith('shape:ray-'))
      if (existingRays.length > 0) {
        editor.updateShapes(existingRays.map((s: any) => ({ id: s.id, type: s.type, isLocked: false })))
        editor.deleteShapes(existingRays.map((s: any) => s.id))
      }

      // 各レーザーの光線追跡
      for (const laser of lasers) {
        let p1_orig, p2_orig

        if (laser.type === 'geo') {
          const transform = editor.getShapePageTransform(laser.id)
          if (!transform) continue
          const w = laser.props.w || 80
          const h = laser.props.h || 40
          
          // 発射口は右側の中央 (w, h/2)
          const startLocal = { x: w, y: h / 2 }
          p1_orig = transform.applyToPoint(startLocal)
          
          // 方向ベクトルは回転角度から計算
          const angle = laser.rotation || 0
          const dx = Math.cos(angle)
          const dy = Math.sin(angle)
          
          // 便宜上のp2 (計算用)
          p2_orig = { x: p1_orig.x + dx * 100, y: p1_orig.y + dy * 100 }
        } else {
          // 互換性のため古いarrowにも対応
          const transform = editor.getShapePageTransform(laser.id)
          if (!transform) continue
          const startProp = laser.props.start || { x: 0, y: 0 }
          const endProp = laser.props.end || { x: 100, y: 0 }
          const start = { x: startProp.x ?? 0, y: startProp.y ?? 0 }
          const end = { x: endProp.x ?? 100, y: endProp.y ?? 0 }
          p1_orig = transform.applyToPoint(start)
          p2_orig = transform.applyToPoint(end)
        }

        const wl = (laser.meta && laser.meta.wavelength) ? Number(laser.meta.wavelength) : 532
        const rayCount = (laser.meta && laser.meta.rayCount !== undefined) ? Math.max(1, Number(laser.meta.rayCount)) : 1
        const beamWidth = (laser.meta && laser.meta.beamWidth !== undefined) ? Number(laser.meta.beamWidth) : 40
        
        let rayColor = 'green'
        if (wl < 450) rayColor = 'violet'
        else if (wl < 500) rayColor = 'blue'
        else if (wl < 550) rayColor = 'green'
        else if (wl < 600) rayColor = 'yellow'
        else if (wl < 650) rayColor = 'orange'
        else rayColor = 'red'

        // 屈折率の分散モデル
        const n_base = 1.5
        const n_wl = 1.5 + (532 - wl) * 0.0001
        const f_dispersion_ratio = (n_base - 1) / (n_wl - 1)

        let V_dir_orig = { x: p2_orig.x - p1_orig.x, y: p2_orig.y - p1_orig.y }
        let len_orig = Math.sqrt(V_dir_orig.x * V_dir_orig.x + V_dir_orig.y * V_dir_orig.y)
        if (len_orig < 5) continue

        let V_orig = { x: V_dir_orig.x / len_orig, y: V_dir_orig.y / len_orig }
        let U_orig = { x: -V_orig.y, y: V_orig.x } // 法線ベクトル（進行方向に垂直）

        // (既存光線の削除は一括で行っているため不要)
        const laserBaseId = laser.id.replace('shape:', '')

        for (let rayIdx = 0; rayIdx < rayCount; rayIdx++) {
          let p1 = { ...p1_orig }
          let p2 = { ...p2_orig }

          if (rayCount > 1) {
            const offsetAmount = -beamWidth / 2 + (rayIdx / (rayCount - 1)) * beamWidth
            p1 = { x: p1_orig.x + U_orig.x * offsetAmount, y: p1_orig.y + U_orig.y * offsetAmount }
            p2 = { x: p2_orig.x + U_orig.x * offsetAmount, y: p2_orig.y + U_orig.y * offsetAmount }
          }

          let initialV_dir = { x: p2.x - p1.x, y: p2.y - p1.y }
          let initialLen = Math.sqrt(initialV_dir.x * initialV_dir.x + initialV_dir.y * initialV_dir.y)
          let initialV = { x: initialV_dir.x / initialLen, y: initialV_dir.y / initialLen }

          // レイトレーシングをキュー構造で実行する（分岐に対応）
          const queue = [{
            P: p1,
            V: initialV,
            branchId: `${rayIdx}`,
            depth: 0,
            startAbs: p1,
            isFirstBranch: true
          }]

          while (queue.length > 0) {
            const currentRay = queue.shift()!
            let { P, V, branchId, depth, startAbs, isFirstBranch } = currentRay
            
            // 光線パスの点リスト（startAbs基準の相対座標）
            const relativePoints: Array<{ x: number; y: number }> = []
            relativePoints.push({ x: 0, y: 0 })

            const maxDepth = 10

            while (depth < maxDepth) {
              let closestIntersection: {
                t: number
                pt: { x: number; y: number }
                type: 'lens' | 'mirror' | 'splitter'
                shape: any
                A: { x: number; y: number }
                B: { x: number; y: number }
              } | null = null

              // --- レンズとの交差 ---
              for (const lens of lenses) {
                const lTransform = editor.getShapePageTransform(lens.id)
                if (!lTransform) continue
                const lw = lens.props.w || 40
                const lh = lens.props.h || 160
                const A = lTransform.applyToPoint({ x: lw / 2, y: 0 })
                const B = lTransform.applyToPoint({ x: lw / 2, y: lh })

                const segDx = B.x - A.x
                const segDy = B.y - A.y
                const det = V.y * segDx - V.x * segDy

                if (Math.abs(det) > 1e-6) {
                  const t = (-segDy * (A.x - P.x) + segDx * (A.y - P.y)) / det
                  const u = (V.x * (A.y - P.y) - V.y * (A.x - P.x)) / det
                  if (t >= 1e-3 && u >= 0.0 && u <= 1.0) {
                    if (!closestIntersection || t < closestIntersection.t) {
                      closestIntersection = { t, pt: { x: P.x + t * V.x, y: P.y + t * V.y }, type: 'lens', shape: lens, A, B }
                    }
                  }
                }
              }

              // --- 鏡との交差 ---
              for (const mirror of mirrors) {
                const mTransform = editor.getShapePageTransform(mirror.id)
                if (!mTransform) continue
                const mw = mirror.props.w || 20
                const mh = mirror.props.h || 160
                let localA = { x: 0, y: 0 }
                let localB = { x: 0, y: mh }
                
                if (mirror.props.mirrorType !== 'flat') {
                  localA = { x: mw, y: 0 }
                  localB = { x: mw, y: mh }
                }
                const A = mTransform.applyToPoint(localA)
                const B = mTransform.applyToPoint(localB)

                const segDx = B.x - A.x
                const segDy = B.y - A.y
                const det = V.y * segDx - V.x * segDy
                if (Math.abs(det) > 1e-6) {
                  const t = (-segDy * (A.x - P.x) + segDx * (A.y - P.y)) / det
                  const u = (V.x * (A.y - P.y) - V.y * (A.x - P.x)) / det
                  if (t >= 1e-3 && u >= 0.0 && u <= 1.0) {
                    if (!closestIntersection || t < closestIntersection.t) {
                      closestIntersection = { t, pt: { x: P.x + t * V.x, y: P.y + t * V.y }, type: 'mirror', shape: mirror, A, B }
                    }
                  }
                }
              }

              // --- スプリッター（板）との交差 ---
              for (const splitter of splitters) {
                const sTransform = editor.getShapePageTransform(splitter.id)
                if (!sTransform) continue
                const sw = splitter.props.w || 20
                const sh = splitter.props.h || 160
                
                // スプリッターの中心面を交差判定に使用
                const A = sTransform.applyToPoint({ x: sw / 2, y: 0 })
                const B = sTransform.applyToPoint({ x: sw / 2, y: sh })

                const segDx = B.x - A.x
                const segDy = B.y - A.y
                const det = V.y * segDx - V.x * segDy
                if (Math.abs(det) > 1e-6) {
                  const t = (-segDy * (A.x - P.x) + segDx * (A.y - P.y)) / det
                  const u = (V.x * (A.y - P.y) - V.y * (A.x - P.x)) / det
                  if (t >= 1e-3 && u >= 0.0 && u <= 1.0) {
                    if (!closestIntersection || t < closestIntersection.t) {
                      closestIntersection = { t, pt: { x: P.x + t * V.x, y: P.y + t * V.y }, type: 'splitter', shape: splitter, A, B }
                    }
                  }
                }
              }

              // --- キューブスプリッターとの交差 ---
              for (const cubeSplitter of cubeSplitters) {
                const cTransform = editor.getShapePageTransform(cubeSplitter.id)
                if (!cTransform) continue
                const cw = cubeSplitter.props.w || 80
                const ch = cubeSplitter.props.h || 80
                
                // 対角面（左下から右上: (0, h) to (w, 0)）を交差判定に使用
                const A = cTransform.applyToPoint({ x: 0, y: ch })
                const B = cTransform.applyToPoint({ x: cw, y: 0 })

                const segDx = B.x - A.x
                const segDy = B.y - A.y
                const det = V.y * segDx - V.x * segDy
                if (Math.abs(det) > 1e-6) {
                  const t = (-segDy * (A.x - P.x) + segDx * (A.y - P.y)) / det
                  const u = (V.x * (A.y - P.y) - V.y * (A.x - P.x)) / det
                  if (t >= 1e-3 && u >= 0.0 && u <= 1.0) {
                    if (!closestIntersection || t < closestIntersection.t) {
                      closestIntersection = { t, pt: { x: P.x + t * V.x, y: P.y + t * V.y }, type: 'splitter', shape: cubeSplitter, A, B }
                    }
                  }
                }
              }

              if (!closestIntersection) {
                // 交点がない場合は画面外へ光線を伸ばして終了
                if (depth === 0 && isFirstBranch && rayCount === 1 && laser.type === 'arrow') {
                  // 古い矢印の単一レーザーの場合は延長しない（矢印自体が描画されるため）
                  relativePoints.length = 0
                } else {
                  const drawLen = 2000
                  const endPt = { x: P.x + V.x * drawLen, y: P.y + V.y * drawLen }
                  relativePoints.push({ x: endPt.x - startAbs.x, y: endPt.y - startAbs.y })
                }
                break
              }

              const { pt: I, type: hitType, shape: hitShape, A, B } = closestIntersection

              // 交点を現在のブランチに追加
              if (depth === 0 && isFirstBranch && laser.type === 'arrow' && closestIntersection.t >= initialLen - 0.1) {
                // レンズが矢印の先端より遠い場合は、先端を経由させる (古い矢印用)
                relativePoints.push({ x: p2.x - p1.x, y: p2.y - p1.y })
              }
              relativePoints.push({ x: I.x - startAbs.x, y: I.y - startAbs.y })

              if (hitType === 'lens') {
                const lw = hitShape.props.w || 40
                const lh = hitShape.props.h || 160
                const lTransform = editor.getShapePageTransform(hitShape.id)
                const C = lTransform.applyToPoint({ x: lw / 2, y: lh / 2 })

                const T = { x: B.x - A.x, y: B.y - A.y }
                const tLen = Math.sqrt(T.x * T.x + T.y * T.y)
                const T_norm = tLen > 1e-8 ? { x: T.x / tLen, y: T.y / tLen } : { x: 1, y: 0 }
                let U = { x: -T_norm.y, y: T_norm.x } 

                if (V.x * U.x + V.y * U.y < 0) {
                  U = { x: -U.x, y: -U.y }
                }

                const f = hitShape.props.focalLength || 150
                const f_eff = f * f_dispersion_ratio
                const hInt = (I.x - C.x) * T_norm.x + (I.y - C.y) * T_norm.y

                const sIn = (V.x * T_norm.x + V.y * T_norm.y) / (V.x * U.x + V.y * U.y)
                const sOut = sIn - hInt / f_eff

                const VPrime_unnorm = { x: U.x + sOut * T_norm.x, y: U.y + sOut * T_norm.y }
                const vpLen = Math.sqrt(VPrime_unnorm.x * VPrime_unnorm.x + VPrime_unnorm.y * VPrime_unnorm.y)
                const VPrime = vpLen > 1e-8 ? { x: VPrime_unnorm.x / vpLen, y: VPrime_unnorm.y / vpLen } : V

                P = { x: I.x + VPrime.x * 1e-2, y: I.y + VPrime.y * 1e-2 }
                V = VPrime
              } 
              else if (hitType === 'mirror' || hitType === 'splitter') {
                const T = { x: B.x - A.x, y: B.y - A.y }
                const tLen = Math.sqrt(T.x * T.x + T.y * T.y)
                const T_norm = tLen > 1e-8 ? { x: T.x / tLen, y: T.y / tLen } : { x: 1, y: 0 }
                let N = { x: -T_norm.y, y: T_norm.x } 

                if (hitType === 'mirror' && hitShape.props.mirrorType === 'curved') {
                  const mh = hitShape.props.h || 160
                  const mTransform = editor.getShapePageTransform(hitShape.id)
                  const C = mTransform.applyToPoint({ x: 0, y: mh / 2 })
                  const f = hitShape.props.focalLength || 150
                  
                  const hInt = (I.x - C.x) * T_norm.x + (I.y - C.y) * T_norm.y
                  N = {
                    x: N.x - (hInt / (2 * f)) * T_norm.x,
                    y: N.y - (hInt / (2 * f)) * T_norm.y
                  }
                  const nLen = Math.sqrt(N.x * N.x + N.y * N.y)
                  if (nLen > 1e-8) {
                    N = { x: N.x / nLen, y: N.y / nLen }
                  }
                }

                if (V.x * N.x + V.y * N.y > 0) {
                  N = { x: -N.x, y: -N.y }
                }

                const dotVal = V.x * N.x + V.y * N.y
                const VReflect = {
                  x: V.x - 2 * dotVal * N.x,
                  y: V.y - 2 * dotVal * N.y
                }

                if (hitType === 'splitter') {
                  // スプリッター：反射光を新しいブランチとしてキューに追加し、透過光は直進させる
                  const PReflect = { x: I.x + VReflect.x * 1e-2, y: I.y + VReflect.y * 1e-2 }
                  queue.push({
                    P: PReflect,
                    V: VReflect,
                    branchId: `${branchId}-${depth}R`,
                    depth: depth + 1,
                    startAbs: PReflect,
                    isFirstBranch: false
                  })

                  // 現在のブランチは透過光として直進
                  P = { x: I.x + V.x * 1e-2, y: I.y + V.y * 1e-2 }
                  // Vは変化なし
                } else {
                  // ミラー：全反射
                  P = { x: I.x + VReflect.x * 1e-2, y: I.y + VReflect.y * 1e-2 }
                  V = VReflect
                }
              }

              depth++
            } // end while (depth < maxDepth)

            if (relativePoints.length > 1) {
              const rayId = `shape:ray-${laserBaseId}-${branchId}` as any
              const points: any = {}
              let currentIndex = 'a1' as IndexKey
              relativePoints.forEach((pt, index) => {
                const key = `pt${index}`
                points[key] = { id: key, index: currentIndex, x: pt.x, y: pt.y }
                currentIndex = getIndexAbove(currentIndex)
              })
              
              editor.createShape({
                id: rayId,
                type: 'line',
                x: startAbs.x,
                y: startAbs.y,
                props: {
                  color: rayColor,
                  dash: 'solid',
                  size: laser.props.size || 'm',
                  spline: 'line',
                  points
                },
                isLocked: true
              })
            }
          } // end while (queue.length > 0)
        } // end rayIdx loop
    } // end laser loop
    }

    // 初回実行
    updateRays()

    // 矢印（レーザー）またはレンズ、鏡が変更された時のみ光線を再計算する
    let isUpdating = false
    const unsubscribe = editor.store.listen((event: any) => {
      if (isUpdating) return

      // 全ての図形の変更を検知して更新する（パフォーマンス上の問題はないため確実性を優先）
      const hasOpticsChanges =
        Object.keys(event.changes.added).length > 0 ||
        Object.keys(event.changes.removed).length > 0 ||
        Object.keys(event.changes.updated).length > 0

      if (hasOpticsChanges) {
        isUpdating = true
        try {
          updateRays()
        } catch (err) {
          console.error("Raytracing error:", err)
        } finally {
          isUpdating = false
        }
      }
    }, { scope: 'document' })

    return () => unsubscribe()

  }, [editor])

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        shapeUtils={customShapeUtils}
        onMount={(ed) => setEditor(ed)}
      />
      {editor && <CustomUI editor={editor} />}
    </div>
  )
}