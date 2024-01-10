import Image from 'next/image'

export default function Home() {
  const items = [1,2,3,4,5,6,7,8,9,]
  return (
    <main className="flex flex-col h-screen font-normal text-black">
      <div className="flex flex-row basis-1/12 bg-green-200 p-1 pl-3 text-2xl">
        <div className='flex flex-cols items-center justify-left'>
          <div><img src="https://img.cuescore.com/image/3/2/31bf20bde717adc6cb934d7b8fddd79d.png" className='w-13'/></div>
          <div className='flex flex-col pl-3'>
            <div className='flex p-1 font-bold'> Turnament test</div>
            <div className='flex p-1 text-xl'>Semi final</div>
            <div className='flex p-1 text-lg'>First to 3 legs</div>
          </div>
          <div className='flex absolute right-0 mr-1 p-2 pl-4 pr-4 border border-green-700 bg-green-500 hover:bg-green-400'>Exit</div>
        </div>

      </div>
      <div className="flex flex-col basis-1/4 p-5 bg-slate-200">
        <div className='flex'>
        <div className="flex items-center justify-center flex-row basis-1/2">
            <img src="https://img.cuescore.com/image/6/4/6acba9414773fd2d369779e04d6a538e.png" className='w-12 '></img>
            <div className="flex items-center justify-center text-center p-2 text-lg font-bold">Ferdinand Velkomozny</div>
          </div>
          <div className="flex flex-row items-center justify-center basis-1/2">
          <div className="flex items-center justify-center text-center p-2 text-lg">Maximilian Augustin Bezpredmetny</div>
          <img src="https://img.cuescore.com/image/e/4/e2024a3843fcb9a6de719bfb66d8ca0d.png" className='w-12 '></img>
          </div>
        </div>
        <div className='flex'>
        <div className="flex flex-col basis-1/2">
            <div className="flex items-center justify-center text-center p-2 text-5xl border-gray-700 border-spacing-1 border bg-green-400 font-bold">501</div>
          </div>
          <div className="flex flex-col basis-1/2">
            <div className="flex items-center justify-center text-center p-2 text-5xl border-gray-700 border-spacing-1 border bg-green-200">501</div>
          </div>
        </div>
                <div className='flex'>
        <div className="flex flex-col basis-1/2">
            <div className="flex items-center justify-center text-center p-2 text-4xl">2</div>
          </div>
          <div className="flex flex-col basis-1/2">
            <div className="flex items-center justify-center text-center p-2 text-4xl">1</div>
          </div>
        </div>
          
        </div>
      <div className="basis-2/3 text-3xl">
        <div className="grid grid-cols-3 gap-1 w-screen h-full">
        <div className="flex items-center justify-center border-2 font-bold text-white bg-orange-700 hover:bg-orange-400">UNDO</div>
          <div className="flex items-center justify-center border-2 font-bold text-6xl text-white bg-slate-700  ">105</div>
          <div className="flex items-center justify-center border-2 font-bold text-white bg-yellow-700 hover:bg-yellow-400">REM</div>
          { items.map((item) => ( <div key={item} className='flex items-center justify-center border-2 bg-blue-700 font-bold text-white hover:bg-blue-400'>{item}</div> )) }
          <div key="CLR" className='flex items-center justify-center border-2 bg-red-600 font-bold text-white hover:bg-red-400'>CLR</div>
          <div key="0" className='flex items-center justify-center border-2 bg-blue-700 font-bold text-white hover:bg-blue-400'>0</div>
          <div key="OK" className='flex items-center justify-center border-2 bg-green-700 font-bold text-white hover:bg-green-400'>OK</div>
        </div>
      </div>
    </main>
  )
}
