import DrawingToolPicker from "./DrawingToolPicker";
import MalamStatusCard, {
    isWaxColorEditable,
} from "./MalamStatusCard";
import WaxColorPicker from "./WaxColorPicker";

export default function MalamToolPanel({
    activeTool,
    malam,
    malamWiggle,
    onSelectTool,
}) {
    const showColorPicker = isWaxColorEditable(malam.malamState);

    return (
        <aside className="w-64 bg-[#0A1712] border border-[#182C24] rounded-2xl p-4 flex flex-col justify-between shrink-0 shadow-lg">
            <div className="flex flex-col gap-5">
                <MalamStatusCard malam={malam} malamWiggle={malamWiggle} />
                <WaxColorPicker
                    malam={malam}
                    showColorPicker={showColorPicker}
                />
                <div className="h-px bg-[#182C24] my-1" />
                <DrawingToolPicker
                    activeTool={activeTool}
                    onSelectTool={onSelectTool}
                />
            </div>
        </aside>
    );
}
