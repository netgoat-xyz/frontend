import ChartVisits from "./components/ChartVisits";

export default function DataChartContainer() {
    return (
        <div className=''>
            <div className='flex justify-between items-center w-full'>
                <div className="flex items-center justify-between w-full border-neutral-800 border border-r-0 bg-neutral-900 p-4 rounded-l-lg ">
                    <div className="mr-12">
                        <p className='text-3xl font-bold'>1.2M</p>
                        <p className='text-sm text-neutral-400'>Visits</p>
                    </div>
                    <ChartVisits />
                </div>
                                <div className="flex items-center justify-between w-full border-neutral-800 border border-r-0 bg-neutral-900 p-4">
                    <div className="mr-12">
                        <p className='text-3xl font-bold'>1.2M</p>
                        <p className='text-sm text-neutral-400'>Visits</p>
                    </div>
                    <ChartVisits />
                </div>
                                <div className="flex items-center justify-between w-full border-neutral-800 border bg-neutral-900 p-4 rounded-r-lg">
                    <div className="mr-12">
                        <p className='text-3xl font-bold'>1.2M</p>
                        <p className='text-sm text-neutral-400'>Visits</p>
                    </div>
                    <ChartVisits />
                </div>
            </div>
        </div>
    );
}