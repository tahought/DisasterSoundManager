"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ShieldAlert, AlertTriangle, MapPin } from "lucide-react";

// Dynamically import the map picker to avoid SSR issues with Leaflet
const LocationPickerMap = dynamic(() => import("@/components/LocationPickerMap"), {
    ssr: false,
    loading: () => <div className="h-[200px] w-full bg-zinc-900 animate-pulse rounded-md flex items-center justify-center text-sm text-zinc-500">マップを読み込み中...</div>
});

const TYPES = ['SOS', '崩落音', '叫び声', '破砕音', '環境音'];
const MOCK_UNITS = [
    { id: 'unit-kyoto-01', lat: 35.0116, lng: 135.7681 },
    { id: 'unit-kyoto-02', lat: 35.0000, lng: 135.7500 },
    { id: 'unit-osaka-01', lat: 34.6937, lng: 135.5023 },
    { id: 'unit-kobe-01', lat: 34.6901, lng: 135.1955 }
];

export function DemoPanel() {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<"preset" | "custom">("preset");
    const [selectedUnit, setSelectedUnit] = useState(MOCK_UNITS[0]);
    const [customUnitId, setCustomUnitId] = useState(`custom-${Math.floor(Math.random() * 10000)}`);

    // Custom Location State
    const [customPosition, setCustomPosition] = useState<{ lat: number, lng: number } | null>({ lat: 35.0, lng: 135.7 });

    const [selectedType, setSelectedType] = useState(TYPES[0]);
    const [confidence, setConfidence] = useState([0.95]);
    const [isInjecting, setIsInjecting] = useState(false);

    const injectIncident = async () => {
        setIsInjecting(true);

        let targetId = selectedUnit.id;
        let targetLat = selectedUnit.lat;
        let targetLng = selectedUnit.lng;

        if (mode === "custom") {
            targetId = customUnitId || `custom-${Math.floor(Math.random() * 10000)}`;
            targetLat = customPosition?.lat || 35.0;
            targetLng = customPosition?.lng || 135.7;

            // Ensure the custom unit exists in the database before adding incident
            const { data: existingUnit } = await supabase
                .from("units")
                .select("id")
                .eq("id", targetId)
                .maybeSingle();

            if (!existingUnit) {
                const { error: unitError } = await supabase.from("units").insert({
                    id: targetId,
                    latitude: targetLat,
                    longitude: targetLng,
                    battery: 100,
                    signal_strength: 'Strong',
                    status: 'online',
                    threshold: 0.8
                });
                if (unitError) {
                    alert(`ユニットの作成に失敗しました: ${unitError.message}`);
                    setIsInjecting(false);
                    return;
                }
            }
        }

        // Create an artificial incident entry
        const { error: incidentError } = await supabase.from("incidents").insert({
            unit_id: targetId,
            type: selectedType,
            confidence: confidence[0],
            status: 'pending',
            audio_url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8b82ecab8.mp3?filename=alert-33762.mp3', // Mock audio
            latitude: targetLat + (Math.random() - 0.5) * 0.01, // Slight jitter for display
            longitude: targetLng + (Math.random() - 0.5) * 0.01,
        });

        if (incidentError) {
            alert(`インシデントの作成に失敗しました: ${incidentError.message}`);
        }

        setIsInjecting(false);
        setOpen(false);
    };

    const handlePositionChange = (pos: { lat: number; lng: number }) => {
        setCustomPosition(pos);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    デモツール
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>インシデント・シミュレーター</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        物理デバイスを使用せずに、データベースへ人工的に検知イベントを注入します。
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={mode} onValueChange={(v) => setMode(v as "preset" | "custom")} className="w-full mt-2">
                    <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border-zinc-800">
                        <TabsTrigger value="preset" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">既存ユニット</TabsTrigger>
                        <TabsTrigger value="custom" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">マップでカスタム設置</TabsTrigger>
                    </TabsList>

                    <TabsContent value="preset" className="space-y-4 py-4 min-h-[250px] flex flex-col justify-center">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-right text-sm text-zinc-400">ユニット</span>
                            <div className="col-span-3">
                                <Select
                                    value={selectedUnit.id}
                                    onValueChange={(val) => setSelectedUnit(MOCK_UNITS.find(u => u.id === val) || MOCK_UNITS[0])}
                                >
                                    <SelectTrigger className="w-full bg-zinc-900 border-zinc-700">
                                        <SelectValue placeholder="ユニットを選択" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                        {MOCK_UNITS.map(unit => (
                                            <SelectItem key={unit.id} value={unit.id}>{unit.id} ({unit.lat.toFixed(2)}, {unit.lng.toFixed(2)})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="custom" className="space-y-4 py-2 min-h-[250px]">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="text-right text-sm text-zinc-400">ID名</span>
                            <div className="col-span-3">
                                <Input
                                    value={customUnitId}
                                    onChange={(e) => setCustomUnitId(e.target.value)}
                                    placeholder="新ユニットID"
                                    className="bg-zinc-900 border-zinc-700 text-sm h-8"
                                />
                            </div>
                        </div>

                        <div className="text-xs text-zinc-400 mt-2 mb-1 pl-1">
                            マップをクリックして設置場所を指定してください:
                        </div>
                        <LocationPickerMap position={customPosition} onPositionChange={handlePositionChange} />

                        <div className="flex gap-4 text-xs text-zinc-500 justify-end pr-1">
                            <span>緯度: {customPosition?.lat.toFixed(4) ?? "-"}</span>
                            <span>経度: {customPosition?.lng.toFixed(4) ?? "-"}</span>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="grid gap-4 pb-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right text-sm text-zinc-400">音の種類</span>
                        <div className="col-span-3">
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="w-full bg-zinc-900 border-zinc-700 h-9">
                                    <SelectValue placeholder="種類を選択" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                    {TYPES.map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right text-sm text-zinc-400">確信度</span>
                        <div className="col-span-3 space-y-2">
                            <Slider
                                value={confidence}
                                onValueChange={setConfidence}
                                max={1.0}
                                step={0.01}
                                className="py-1"
                            />
                            <div className="text-xs text-zinc-500 text-right">
                                {(confidence[0] * 100).toFixed(0)}%
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-2 border-t border-zinc-800 pt-4">
                    <Button variant="ghost" className="hover:text-zinc-100 hover:bg-zinc-900" onClick={() => setOpen(false)}>キャンセル</Button>
                    <Button
                        className="bg-destructive hover:bg-destructive/90 text-white"
                        onClick={injectIncident}
                        disabled={isInjecting || (mode === "custom" && !customPosition)}
                    >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        {isInjecting ? "注入中..." : "インシデント注入"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
